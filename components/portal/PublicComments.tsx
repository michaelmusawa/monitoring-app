// components/portal/PublicComments.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThumbsUp, MessageSquare, Filter, Send, Star } from "lucide-react";

const publicComments = []; // Replace with actual data import
const users = []; // Replace with actual data import

interface Comment {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  attachments: any[];
  replies: any[];
}

interface PublicCommentsProps {
  comments: Comment[];
}

export default function PublicComments({ comments }: PublicCommentsProps) {
  const [filter, setFilter] = useState("ALL");
  const [newComment, setNewComment] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(3);
  const [category, setCategory] = useState("FEEDBACK");

  const categories = [
    "ALL",
    "COMMENDATION",
    "COMPLAINT",
    "ENQUIRY",
    "SUGGESTION",
    "FEEDBACK",
  ];

  const filteredComments = comments.filter(
    (comment) => filter === "ALL" || category === "FEEDBACK", // Simplified filter
  );

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Anonymous";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, just log the comment
    console.log({
      name,
      rating,
      category,
      comment: newComment,
    });
    alert("Thank you for your feedback! (Demo mode)");
    setNewComment("");
    setName("");
    setRating(3);
    setCategory("FEEDBACK");
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-gray-500">
          {filteredComments.length} comments
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {filteredComments.slice(0, 5).map((comment) => (
          <div
            key={comment.id}
            className="p-4 rounded-lg border hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium">{getUserName(comment.userId)}</h4>
                <p className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < 4 // Static rating for demo
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm mb-3">{comment.content}</p>
            <div className="flex items-center justify-between">
              <span
                className={`text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800`}
              >
                PUBLIC COMMENT
              </span>
              <Button variant="ghost" size="sm">
                <ThumbsUp className="w-4 h-4 mr-1" />
                Helpful
              </Button>
            </div>
            {comment.replies.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  {comment.replies.length} official{" "}
                  {comment.replies.length === 1 ? "reply" : "replies"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Comment Form */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Add Your Feedback
        </h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.slice(1).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Share your feedback about county projects..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
            required
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rating:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" size="sm">
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
