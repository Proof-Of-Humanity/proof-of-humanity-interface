import React from "react";
import { useDropzone } from "react-dropzone";

interface UploaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop"> {
  onDrop: <T extends File>(acceptedFiles: T[]) => void;
  type: "all" | "video" | "image";
  disabled?: boolean;
}

const MEDIA_TYPES = {
  image: { "image/*": [".jpg", ".jpeg", ".png"] },
  video: { "video/*": [".mp4", ".webm", ".mov", ".qt"] },
};

const Uploader: React.FC<UploaderProps> = ({
  onDrop,
  type,
  children,
  disabled,
  ...props
}) => {
  // const [dragEntered, setDragEntered] = useState(false);
  const { getRootProps, getInputProps } = useDropzone({
    disabled,
    multiple: false,
    accept: type !== "all" ? MEDIA_TYPES[type] : undefined,
    // onDragEnter: () => setDragEntered(true),
    // onDragLeave: () => setDragEntered(false),
    onDrop: (acceptedFiles) => {
      onDrop(acceptedFiles);
      // setDragEntered(false);
    },
  });

  return (
    <div className="flex flex-col cursor-pointer">
      <div {...props} {...getRootProps()}>
        <input {...getInputProps()} />
        {children}
      </div>
    </div>
  );
};

export default Uploader;
