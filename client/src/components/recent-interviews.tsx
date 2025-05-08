import { Interview } from "@shared/schema";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentInterviewsProps {
  interviews: Interview[];
  isLoading: boolean;
}

export default function RecentInterviews({ interviews, isLoading }: RecentInterviewsProps) {
  const [, navigate] = useLocation();
  
  const formatDate = (dateString: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };
  
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    return `${mins} mins`;
  };
  
  const getScoreIcon = (score: number | null) => {
    if (score === null) return null;
    
    if (score >= 80) {
      return <ArrowUp className="ml-1 h-5 w-5 text-green-500" />;
    } else if (score >= 60) {
      return <CheckCircle className="ml-1 h-5 w-5 text-yellow-500" />;
    } else {
      return <ArrowDown className="ml-1 h-5 w-5 text-red-500" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-neutral-200">
            {status}
          </Badge>
        );
    }
  };
  
  const viewReport = (id: number, status: string) => {
    if (status === "completed") {
      navigate(`/feedback/${id}`);
    } else {
      navigate(`/interview/${id}`);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium text-neutral-900">Recent Interviews</CardTitle>
            <CardDescription className="text-neutral-500">Your interview practice sessions</CardDescription>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Card>
    );
  }
  
  if (interviews.length === 0) {
    return (
      <Card className="shadow">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
          <CardTitle className="text-lg font-medium text-neutral-900">Recent Interviews</CardTitle>
          <CardDescription className="text-neutral-500">Your interview practice sessions</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-2 text-lg font-medium text-neutral-900">No interviews yet</h3>
          <p className="mt-1 text-neutral-500">Start a new interview to practice your skills</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between items-center">
        <div>
          <CardTitle className="text-lg font-medium text-neutral-900">Recent Interviews</CardTitle>
          <CardDescription className="text-neutral-500">
            {interviews.length > 5 ? "Your last 5 interview practice sessions" : "Your interview practice sessions"}
          </CardDescription>
        </div>
        {interviews.length > 5 && (
          <Button variant="link" onClick={() => {/* would navigate to a full history page */}}>
            View all
          </Button>
        )}
      </CardHeader>
      
      {/* Mobile view - card layout */}
      <div className="md:hidden">
        <div className="divide-y divide-neutral-200">
          {interviews.slice(0, 5).map((interview) => (
            <div key={interview.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">{interview.title}</h3>
                  {interview.company && (
                    <p className="text-xs text-neutral-500">{interview.company}</p>
                  )}
                </div>
                <div>{getStatusBadge(interview.status)}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                <div>
                  <span className="text-neutral-500">Date:</span> {formatDate(interview.date)}
                </div>
                <div>
                  <span className="text-neutral-500">Duration:</span> {formatDuration(interview.duration)}
                </div>
                <div className="flex items-center">
                  <span className="text-neutral-500 mr-1">Score:</span>
                  {interview.score !== null ? (
                    <div className="flex items-center">
                      <span className="font-medium">{interview.score}%</span>
                      {getScoreIcon(interview.score)}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 text-neutral-400 mr-1" />
                      <span>Pending</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                variant="outline"
                size="sm"
                className="w-full text-primary-600 border-primary-200 hover:bg-primary-50"
                onClick={() => viewReport(interview.id, interview.status)}
              >
                <Eye className="h-3 w-3 mr-1" />
                {interview.status === "completed" ? "View Report" : "Continue"}
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Desktop view - table layout */}
      <div className="hidden md:block">
        <table className="w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-1/4">
                Job Title
              </th>
              <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Score
              </th>
              <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                Duration
              </th>
              <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-3 md:px-6 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {interviews.slice(0, 5).map((interview) => (
              <tr key={interview.id}>
                <td className="px-3 md:px-6 py-4">
                  <div className="text-sm font-medium text-neutral-900 truncate max-w-[150px]">{interview.title}</div>
                  {interview.company && (
                    <div className="text-sm text-neutral-500 truncate max-w-[150px]">{interview.company}</div>
                  )}
                </td>
                <td className="px-3 md:px-6 py-4 text-sm text-neutral-500">
                  {formatDate(interview.date)}
                </td>
                <td className="px-3 md:px-6 py-4">
                  {interview.score !== null ? (
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-neutral-900">{interview.score}%</div>
                      {getScoreIcon(interview.score)}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-neutral-400 mr-1" />
                      <span className="text-sm text-neutral-500">Pending</span>
                    </div>
                  )}
                </td>
                <td className="px-3 md:px-6 py-4 text-sm text-neutral-500 hidden lg:table-cell">
                  {formatDuration(interview.duration)}
                </td>
                <td className="px-3 md:px-6 py-4">
                  {getStatusBadge(interview.status)}
                </td>
                <td className="px-3 md:px-6 py-4 text-right text-sm font-medium">
                  <Button 
                    variant="link" 
                    className="text-primary-600 hover:text-primary-900 whitespace-nowrap"
                    onClick={() => viewReport(interview.id, interview.status)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{interview.status === "completed" ? "View Report" : "Continue"}</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
