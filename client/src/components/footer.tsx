import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-6 md:py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col">
            <h2 className="mb-4 text-lg font-semibold">InterviewAI</h2>
            <p className="text-sm text-muted-foreground">
              Practice interviews with AI and improve your interview skills with real-time feedback.
            </p>
          </div>
          <div className="flex flex-col">
            <h2 className="mb-4 text-lg font-semibold">Links</h2>
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                Login / Register
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="mb-4 text-lg font-semibold">Legal</h2>
            <div className="flex flex-col space-y-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} InterviewAI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Contact Us
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}