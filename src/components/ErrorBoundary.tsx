import { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "sonner";
import { Empty } from "./Empty";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    toast.error(`发生错误: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      return <Empty error={this.state.error} />;
    }

    return this.props.children;
  }
}