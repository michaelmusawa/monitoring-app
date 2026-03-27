"use client";

import React, { useState } from "react";
// Adjust path as needed
import Image from "next/image";

const publicComments = []; // Replace with actual data import
const users = []; // Replace with actual data import

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
};
type Reply = {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
};
type PublicComment = {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: Attachment[];
  replies?: Reply[];
};

export default function PublicComments({ projectId }: { projectId: string }) {
  // Filter comments for this project and sort by date (newest first)
  const filteredComments = publicComments
    .filter((comment) => comment.projectId === projectId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const [comments, setComments] = useState<PublicComment[]>(filteredComments);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [replyState, setReplyState] = useState<
    Record<string, { open: boolean; text: string }>
  >({});

  // Function to get user details by ID
  const getUserById = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user || { name: "Unknown User", email: "", phone: "", avatar: "" };
  };

  // Function to get user name from userId for replies
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    if (!form.message.trim()) {
      alert("Please enter a message");
      return;
    }

    // Create new comment
    const now = new Date().toISOString();
    const newComment: PublicComment = {
      id: `comment-${Date.now()}`,
      projectId,
      userId: "user-1", // Default user ID (could be current user in real app)
      content: form.message,
      createdAt: now,
      updatedAt: now,
      attachments: [],
      replies: [],
    };

    // Update state optimistically
    setComments((prev) => [newComment, ...prev]);
    setForm({ name: "", email: "", phone: "", message: "" });

    // In a real app, you would save to backend here
    console.log("New comment:", newComment);
  }

  function submitReply(commentId: string) {
    const state = replyState[commentId];
    if (!state || !state.text.trim()) {
      alert("Please enter a reply");
      return;
    }

    // Create new reply
    const now = new Date().toISOString();
    const newReply: Reply = {
      id: `reply-${Date.now()}`,
      commentId,
      userId: "user-4", // Default reply user ID (could be current user in real app)
      content: state.text,
      createdAt: now,
    };

    // Update state optimistically
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [...(c.replies || []), newReply],
            }
          : c,
      ),
    );

    setReplyState((s) => ({ ...s, [commentId]: { open: false, text: "" } }));

    // In a real app, you would save to backend here
    console.log("New reply:", newReply);
  }

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Public Comments</h2>

      {/* Comments List */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">Recent Comments</h3>

        {comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const user = getUserById(comment.userId);

            return (
              <div
                key={comment.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {!user.avatar && (
                      <Image
                        src={user.avatar}
                        width={40}
                        height={40}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-gray-500">
                        {user.email && (
                          <span className="mr-3">{user.email}</span>
                        )}
                        {user.phone && <span>{user.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(comment.createdAt)}
                  </div>
                </div>

                {/* Comment Content */}
                <div className="mb-4">
                  <p className="text-gray-700">{comment.content}</p>
                </div>

                {/* Attachments */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Attachments</div>
                    <div className="space-y-2">
                      {comment.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center">
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-2"
                          >
                            <span>📎</span>
                            <span>{attachment.fileName}</span>
                            <span className="text-gray-500 text-xs">
                              ({attachment.fileSize})
                            </span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm font-medium mb-4">
                      Replies ({comment.replies.length})
                    </div>
                    <div className="space-y-4">
                      {comment.replies.map((reply) => {
                        const replyUser = getUserById(reply.userId);
                        return (
                          <div
                            key={reply.id}
                            className="bg-gray-50 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {replyUser.avatar && (
                                  <img
                                    src={replyUser.avatar}
                                    alt={replyUser.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                <div className="font-medium">
                                  {replyUser.name}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </div>
                            </div>
                            <div className="text-gray-700 text-sm">
                              {reply.content}
                            </div>

                            {/* Reply Attachments */}
                            {reply.attachments &&
                              reply.attachments.length > 0 && (
                                <div className="mt-2">
                                  {reply.attachments.map((attachment) => (
                                    <a
                                      key={attachment.id}
                                      href={attachment.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                                    >
                                      <span>📎</span>
                                      <span>{attachment.fileName}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reply UI */}
                <div className="mt-6">
                  {replyState[comment.id]?.open ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyState[comment.id]?.text ?? ""}
                        onChange={(e) =>
                          setReplyState((s) => ({
                            ...s,
                            [comment.id]: {
                              ...(s[comment.id] || { open: true, text: "" }),
                              text: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Type your reply here..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitReply(comment.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                          type="button"
                        >
                          Post Reply
                        </button>
                        <button
                          onClick={() =>
                            setReplyState((s) => ({
                              ...s,
                              [comment.id]: { open: false, text: "" },
                            }))
                          }
                          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setReplyState((s) => ({
                          ...s,
                          [comment.id]: { open: true, text: "" },
                        }))
                      }
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      type="button"
                    >
                      Reply to Comment
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
