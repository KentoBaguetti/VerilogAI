import React, { useState, useEffect, useRef } from "react";

interface CreateFileModalProps {
  isOpen: boolean;
  type: "file" | "folder";
  onClose: () => void;
  onCreate: (name: string) => void;
  folderPath: string;
}

const CreateFileModal: React.FC<CreateFileModalProps> = ({
  isOpen,
  type,
  onClose,
  onCreate,
  folderPath,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setError("");
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const validateName = (value: string): boolean => {
    if (!value) {
      setError("Name cannot be empty");
      return false;
    }

    const pattern = type === "file" ? /^[a-zA-Z0-9_.-]+$/ : /^[a-zA-Z0-9_-]+$/;

    if (!pattern.test(value)) {
      setError(
        type === "file"
          ? "Use only letters, numbers, dots, dashes, and underscores"
          : "Use only letters, numbers, dashes, and underscores"
      );
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateName(name)) {
      onCreate(name);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-lg shadow-xl p-6 w-96 border"
        style={{ borderColor: "#D4C4A8" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-ink mb-4">
          Create New {type === "file" ? "File" : "Folder"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name-input"
              className="block text-sm font-medium text-ink mb-2"
            >
              {type === "file" ? "File" : "Folder"} Name
            </label>
            <input
              ref={inputRef}
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) validateName(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sage bg-white"
              style={{ borderColor: error ? "#C85C3C" : "#D4C4A8" }}
              placeholder={type === "file" ? "example.v" : "my-folder"}
            />
            {error && <p className="mt-1 text-sm text-rust">{error}</p>}
            <p className="mt-1 text-xs text-ink opacity-60">
              Location: {folderPath === "/" ? "root" : folderPath}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-ink rounded-md hover:bg-sand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
              style={{
                background: "#8B9A7E",
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFileModal;
