import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getRandomInterviewCover } from "@/lib/utils";

interface RouteParams {
  params: {
    id: string;
  };
}

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = params;

  const user = await getCurrentUser();
  const interview = await getInterviewById(id);

  if (!interview) {
    redirect("/");
  }

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize text-xl font-bold">{interview.role} Interview</h3>
          </div>
          <DisplayTechIcons techStack={interview.techstack} />
        </div>
        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">{interview.type}</p>
      </div>

      <div className="mt-4">
        {feedback ? (
          <div className="space-y-10 p-6 bg-dark-200 rounded-lg">
            <h2 className="text-3xl font-bold text-center">Interview Feedback Report</h2>

            <div>
              <h3 className="text-xl font-bold mb-4">Detailed Question Analysis</h3>
              <div className="space-y-6">
                {feedback.detailedFeedback.map((item, index) => (
                  <div key={index} className="p-4 bg-dark-300 rounded-md">
                    <p className="font-bold mb-3">Q: {item.question}</p>
                    <div className="pl-4 border-l-2 border-dark-400 space-y-4 text-sm">
                      <div>
                        <strong className="text-gray-400 block mb-1">Your Answer:</strong>
                        <p>{item.userAnswer}</p>
                      </div>
                      <div>
                        <strong className="text-blue-400 block mb-1">Feedback:</strong>
                        <p>{item.feedback}</p>
                      </div>
                      <div>
                        <strong className="text-primary-500 block mb-1">Example Response:</strong>
                        <p>{item.exampleResponse}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-dark-300" />

            <div>
              <h3 className="text-xl font-bold mb-4">Overall Assessment</h3>
              <div className="text-center mb-8">
                <p className="text-gray-400">Overall Score</p>
                <p className="text-4xl font-bold text-primary-500">{feedback.totalScore}/100</p>
                <p className="mt-2 max-w-2xl mx-auto text-gray-300">{feedback.finalAssessment}</p>
              </div>

              <div className="space-y-4">
                {feedback.categoryScores.map((category, index) => (
                  <div key={index} className="p-4 bg-dark-300 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold">{category.name}</p>
                      <p className="font-bold text-primary-500">{category.score}/10</p>
                    </div>
                    <p className="text-sm text-gray-400">{category.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Agent
            userName={user?.name!}
            userId={user?.id}
            interviewId={id}
            type="interview"
            questions={interview.questions}
            feedbackId={feedback?.id}
          />
        )}
      </div>
    </section>
  );
};

export default InterviewDetails;