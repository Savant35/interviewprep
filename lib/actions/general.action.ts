"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

type CreateFeedbackParams = {
  interviewId: string;
  userId: string;
  transcript: { role: "user" | "assistant"; content: string }[];
  feedbackId?: string;
};

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map((sentence: { role: string; content: string }) =>
        `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
You are an experienced AI interviewer evaluating a candidate's mock interview. 
Follow the instructions below carefully to ensure objective and accurate scoring.

Instructions:
- Be thorough, objective, and critical, but also fair. Do not inflate scores, but recognize and reward strong, well-supported responses appropriately. High scores should reflect excellence, not perfection.
- Only evaluate based on the transcript provided. Do not assume or infer missing information.
- Evaluate strictly according to the listed categories. Do not add or remove categories.
- Provide a score from 0 to 100 for each category, with a brief explanation (1-2 sentences) for each score.
- Use the full scoring range appropriately — low scores should be given if performance is weak.

Transcript:
${formattedTranscript}
Use the fallowing rule brick:
- **0–10:** Completely off‑topic or no response; no evidence of understanding.  
- **11–20:** Fundamentally flawed; critical concepts are missing or incorrect.  
- **21–30:** Major gaps; only minimal relevant content, serious misunderstandings.  
- **31–40:** Approaches relevance but with significant errors or omissions.  
- **41–50:** Basic competence; some correct points but clear weaknesses.  
- **51–60:** Fair performance; adequate understanding with noticeable inconsistencies.  
- **61–70:** Good performance; solid understanding but lacking depth in places.  
- **71–80:** Very good; clear, accurate responses with minor lapses.  
- **81–90:** Excellent; thorough, well‑reasoned, and articulate with strong examples.  
- **91–100:** Outstanding; exemplary insight, depth, and clarity exceeding expectations.

To Evaluate the candidate on the following:

1. **Communication Skills**: Clarity, articulation, and logical structure of responses.
2. **Technical Knowledge**: Depth and accuracy of technical concepts relevant to the role.
3. **Problem-Solving**: Ability to understand problems, reason through them, and propose solutions.
4. **Critical Thinking**: Ability to think independently, challenge assumptions, and offer well-reasoned insights.
5. **Confidence & Clarity**: Demonstrated self-assurance, engagement, and overall clarity when responding.



Be specific in your feedback, highlighting both strengths and areas for improvement for each category.
`,
      system:
        "You are a professional interviewer evaluating a mock interview. Provide thorough, objective feedback based strictly on the evaluation criteria provided, without making assumptions beyond the transcript and Provided User Answers.",

    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(
  id: string
): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();
  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;
  const snapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;
  const interviews = await db
    .collection("interviews")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}
