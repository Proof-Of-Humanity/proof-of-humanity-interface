"use client";

import Link from "next/link";
import { ipfs } from "utils/ipfs";
import AttachmentIcon from "icons/AttachmentMajor.svg";

interface AttachmentProps {
  uri: string;
}

const Attachment: React.FC<AttachmentProps> = ({ uri }) => {
  const ipfsUri = ipfs(uri);

  return (
    <Link href={`/attachment?url=${encodeURIComponent(ipfsUri)}`}>
      <AttachmentIcon className="fill-black w-4 h-4" />
    </Link>
  );
};

export default Attachment;
