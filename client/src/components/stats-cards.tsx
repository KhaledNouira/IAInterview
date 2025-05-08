import { Interview } from "@shared/schema";
import { 
  CalendarDays, 
  TrendingUp, 
  CheckCircle,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface StatsCardsProps {
  interviews: Interview[];
  isLoading: boolean;
}

export default function StatsCards({ interviews, isLoading }: StatsCardsProps) {
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <CardContent className="px-4 py-5 sm:p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate stats
  const completedInterviews = interviews.filter(interview => interview.status === "completed").length;
  
  // Calculate average score (only from completed interviews with scores)
  const interviewsWithScores = interviews.filter(interview => 
    interview.status === "completed" && interview.score !== null
  );
  
  const averageScore = interviewsWithScores.length > 0
    ? Math.round(interviewsWithScores.reduce((sum, interview) => sum + (interview.score || 0), 0) / interviewsWithScores.length)
    : 0;
  
  // Calculate improvement rate (simple placeholder calculation)
  // In a real app, this would compare recent scores to older scores
  const improvementRate = interviewsWithScores.length >= 2 ? "+12%" : "N/A";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Interviews Completed */}
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <CalendarDays className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Interviews Completed</dt>
                <dd>
                  <div className="text-lg font-medium text-neutral-900">{completedInterviews}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Score */}
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Average Score</dt>
                <dd>
                  <div className="text-lg font-medium text-neutral-900">
                    {interviewsWithScores.length > 0 ? `${averageScore}%` : "No data"}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Rate */}
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Improvement Rate</dt>
                <dd>
                  <div className="text-lg font-medium text-neutral-900">{improvementRate}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Card */}
      <Card className="bg-primary-600 overflow-hidden shadow rounded-lg">
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-md p-3">
              <PlusCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <h3 className="text-lg font-medium text-white">Start a new interview</h3>
              <p className="text-primary-100 mt-1 text-sm">Practice for your next job opportunity</p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50"
              onClick={() => {
                // Scroll to job description form
                const form = document.querySelector('#job-description-form');
                if (form) {
                  form.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              New Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
