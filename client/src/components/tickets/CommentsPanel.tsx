import { useState } from "react";
import Button from "../ui/button/Button";
import { formatDateTime } from "../../lib/ticketing/helpers";
import type { TicketComment } from "../../lib/ticketing/types";

interface CommentsPanelProps {
  comments: TicketComment[];
  onSubmit: (message: string) => Promise<void>;
}

export default function CommentsPanel({
  comments,
  onSubmit,
}: CommentsPanelProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(message);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No comments yet.
          </div>
        ) : (
          comments
            .slice()
            .reverse()
            .map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {comment.author.fullName}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {comment.author.role}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(comment.createdAt)}
                  </p>
                </div>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                  {comment.message}
                </p>
              </div>
            ))
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <textarea
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          placeholder="Add a progress update, note, or question"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? "Posting..." : "Post comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
