import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type AdminOption = {
  label: string;
  isCorrect: boolean;
};

type AdminQuestion = {
  type: 'QCM' | 'QROC';
  time: number;
  title: string;
  stem: string;
  explanation: string;
  nextData: string;
  expected: string;
  options: AdminOption[];

  stemImageUrl?: string;
  explanationImageUrl?: string;
};

type AdminCasePayload = {
  title: string;
  specialty: string;
  difficulty: string;
  description: string;
  questions: AdminQuestion[];
};

function createPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  let createdCaseId: number | null = null;

  try {
    /*
     * 1. Vérifier que l'utilisateur est connecté
     */
    const authorization = request.headers.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Utilisateur non authentifié.',
        },
        {
          status: 401,
        }
      );
    }

    const token = authorization.replace('Bearer ', '');

    const publicSupabase = createPublicSupabase();

    const {
      data: { user },
      error: userError,
    } = await publicSupabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Session invalide.',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 2. Vérifier que l'utilisateur est administrateur
     */
    const adminEmail = process.env.ADMIN_EMAIL;

    if (
      !adminEmail ||
      user.email?.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: 'Accès administrateur refusé.',
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 3. Lire le formulaire
     */
    const body = (await request.json()) as AdminCasePayload;

    const {
      title,
      specialty,
      difficulty,
      description,
      questions,
    } = body;

    /*
     * 4. Validation générale
     */
    if (!title?.trim()) {
      return NextResponse.json(
        {
          error: 'Le titre du cas est obligatoire.',
        },
        {
          status: 400,
        }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        {
          error: 'Ajoutez au moins une question.',
        },
        {
          status: 400,
        }
      );
    }

    const adminSupabase = createAdminSupabase();

    /*
     * 5. Créer le cas
     */
    const slug = slugify(title);

    const {
      data: clinicalCase,
      error: caseError,
    } = await adminSupabase
      .from('clinical_cases')
      .insert({
        slug,
        title: title.trim(),
        specialty:
          specialty?.trim() || 'Réanimation',
        difficulty:
          difficulty?.trim() || 'Intermédiaire',
        description:
          description?.trim() || null,
      })
      .select('id, slug')
      .single();

    if (caseError || !clinicalCase) {
      throw new Error(
        caseError?.message ||
          'Impossible de créer le cas clinique.'
      );
    }

    createdCaseId = clinicalCase.id;

    /*
     * 6. Créer les questions
     */
    for (
      let index = 0;
      index < questions.length;
      index++
    ) {
      const question = questions[index];

      /*
       * Validation question
       */
      if (!question.stem?.trim()) {
        throw new Error(
          `Question ${index + 1} : l’énoncé est obligatoire.`
        );
      }

      if (
        question.time < 20 ||
        question.time > 60
      ) {
        throw new Error(
          `Question ${index + 1} : le temps doit être compris entre 20 et 60 secondes.`
        );
      }

      if (
        question.type !== 'QCM' &&
        question.type !== 'QROC'
      ) {
        throw new Error(
          `Question ${index + 1} : type de question invalide.`
        );
      }

      /*
       * Préparer mots-clés QROC
       */
      const expectedKeywords =
        question.type === 'QROC'
          ? question.expected
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : [];

      if (
        question.type === 'QROC' &&
        expectedKeywords.length === 0
      ) {
        throw new Error(
          `Question ${index + 1} : ajoutez au moins une réponse acceptée pour la QROC.`
        );
      }

      /*
       * Créer la question
       */
      const {
        data: createdQuestion,
        error: questionError,
      } = await adminSupabase
        .from('questions')
        .insert({
          case_id: clinicalCase.id,
          position: index + 1,
          type: question.type,

          time_limit_seconds:
            question.time,

          title:
            question.title?.trim() ||
            `Question ${index + 1}`,

          stem:
            question.stem.trim(),

          stem_image_url:
            question.stemImageUrl || null,

          explanation:
            question.explanation?.trim() || null,

          explanation_image_url:
            question.explanationImageUrl || null,

          next_data:
            question.nextData?.trim() || '',

          expected_keywords:
            expectedKeywords,
        })
        .select('id')
        .single();

      if (
        questionError ||
        !createdQuestion
      ) {
        throw new Error(
          questionError?.message ||
            `Impossible de créer la question ${index + 1}.`
        );
      }

      /*
       * 7. Ajouter les réponses QCM
       */
      if (question.type === 'QCM') {
        const validOptions =
          question.options
            .map((option) => ({
              ...option,
              label:
                option.label?.trim() || '',
            }))
            .filter(
              (option) =>
                option.label.length > 0
            );

        if (validOptions.length < 2) {
          throw new Error(
            `Question ${index + 1} : ajoutez au moins deux propositions.`
          );
        }

        const hasCorrectAnswer =
          validOptions.some(
            (option) =>
              option.isCorrect
          );

        if (!hasCorrectAnswer) {
          throw new Error(
            `Question ${index + 1} : sélectionnez au moins une bonne réponse.`
          );
        }

        const optionsToInsert =
          validOptions.map(
            (
              option,
              optionIndex
            ) => ({
              question_id:
                createdQuestion.id,

              position:
                optionIndex + 1,

              label:
                option.label,

              is_correct:
                option.isCorrect,
            })
          );

        const {
          error: optionsError,
        } = await adminSupabase
          .from('question_options')
          .insert(optionsToInsert);

        if (optionsError) {
          throw new Error(
            `Question ${index + 1} : ${optionsError.message}`
          );
        }
      }
    }

    /*
     * 8. Succès
     */
    return NextResponse.json({
      success: true,
      slug: clinicalCase.slug,
      caseId: clinicalCase.id,
    });

  } catch (error) {
    /*
     * Si une erreur arrive après la création du cas,
     * supprimer le cas incomplet.
     *
     * Tes relations ON DELETE CASCADE supprimeront
     * aussi ses questions et propositions.
     */
    if (createdCaseId) {
      try {
        const adminSupabase =
          createAdminSupabase();

        await adminSupabase
          .from('clinical_cases')
          .delete()
          .eq(
            'id',
            createdCaseId
          );
      } catch (
        cleanupError
      ) {
        console.error(
          'Erreur pendant le nettoyage :',
          cleanupError
        );
      }
    }

    console.error(
      'Erreur création cas :',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur inconnue lors de la création du cas.',
      },
      {
        status: 500,
      }
    );
  }
}