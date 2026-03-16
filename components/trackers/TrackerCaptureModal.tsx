"use client";

/**
 * TrackerCaptureModal
 * Thin re-export of TrackerReviewCapture with prop names aligned to ProjectTrackers.
 */

import TrackerReviewCapture, {
  TrackerCaptureData,
} from "./TrackerReviewCapture";

export type { TrackerCaptureData };

interface TrackerCaptureModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  submissionId: string;
  submissionTitle: string;
  /** Called after successful save — parent triggers report generation */
  onComplete: (data: TrackerCaptureData) => void;
}

export function TrackerCaptureModal({
  open,
  onClose,
  projectId,
  submissionId,
  submissionTitle,
  onComplete,
}: TrackerCaptureModalProps) {
  return (
    <TrackerReviewCapture
      open={open}
      onClose={onClose}
      projectId={projectId}
      projectName={submissionTitle}
      trackerSubmissionId={submissionId}
      onSaved={onComplete}
    />
  );
}
