"use client";

import { ObservableObject } from "@legendapp/state";
import Previewed from "components/Previewed";
import Uploader from "components/Uploader";
import Webcam from "components/Webcam";
import useFullscreen from "hooks/useFullscreen";
import { useLoading } from "hooks/useLoading";
import CircleCancel from "icons/CircleCancelMinor.svg";
import CircleTick from "icons/CircleTickMinor.svg";
import CheckmarkIcon from "icons/MobileAcceptMajor.svg";
import ResetIcon from "icons/ResetMinor.svg";
import ZoomIcon from "icons/SearchMajor.svg";
import CameraIcon from "icons/camera.svg";
import UploadIcon from "icons/upload.svg";
import Image, { StaticImageData } from "next/image";
import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop/types";
import { toast } from "react-toastify";
import ReactWebcam from "react-webcam";
import { getCroppedPhoto, sanitizeImage } from "utils/media";
import { base64ToUint8Array } from "utils/misc";
import { MediaState } from "./Form";

const MIN_DIMS = { width: 256, height: 256 }; // PXs
const MAX_SIZE = 3; // Megabytes
const MAX_SIZE_BYTES = 1024 * 1024 * MAX_SIZE; // Bytes
const ERROR_MSG = {
  dimensions: `Photo dimensions are too small. Minimum dimensions are ${MIN_DIMS.width}px by ${MIN_DIMS.height}px`,
  size: `Photo is oversized. Maximum allowed size is ${MAX_SIZE}mb`,
};

interface PhotoProps {
  advance: () => void;
  photo$: ObservableObject<MediaState["photo"]>;
}

const ExamplePic: React.FC<
  Omit<StaticImageData, "width" | "height"> & { wrong?: boolean }
> = ({ wrong, ...imageProps }) => (
  <div className="flex flex-col items-center">
    <Image
      alt="example"
      className="mb-2 h-36 w-36 rounded-sm"
      width={512}
      height={512}
      {...imageProps}
    />
    {wrong ? (
      <CircleCancel className="h-6 w-6 fill-red-500" />
    ) : (
      <CircleTick className="h-6 w-6 fill-green-500" />
    )}
  </div>
);

function Photo({ advance, photo$ }: PhotoProps) {
  const photo = photo$.use();
  const fullscreenRef = useRef(null);
  const { isFullscreen, setFullscreen, toggleFullscreen } =
    useFullscreen(fullscreenRef);

  const [originalPhoto, setOriginalPhoto] = useState<{
    uri: string;
    buffer: Buffer;
  } | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [camera, setCamera] = useState<ReactWebcam | null>(null);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [maxZoom, setMaxZoom] = useState(3);
  const [zoom, setZoom] = useState(1);

  const loading = useLoading();
  const [pending, loadingMessage] = loading.use();

  const onCrop = async () => {
    if (!cropPixels || !originalPhoto) return;
    if (
      cropPixels.width < MIN_DIMS.width ||
      cropPixels.height < MIN_DIMS.height
    ) {
      toast.error(ERROR_MSG.dimensions);
      return console.error("Dimensions error");
    }

    loading.start("Cropping photo");

    const cropped = await getCroppedPhoto(originalPhoto.uri, cropPixels);
    if (!cropped) return;

    try {
      const sanitized = await sanitizeImage(
        Buffer.from(base64ToUint8Array(cropped.split(",")[1])),
      );
      if (sanitized.size > MAX_SIZE_BYTES) {
        toast.error(ERROR_MSG.size);
        //return console.error("Size error");
      }

      photo$.set({ content: sanitized, uri: URL.createObjectURL(sanitized) });
    } catch (err: any) {
      toast.error(err.message);
    }

    loading.stop();
  };

  const takePhoto = async () => {
    setFullscreen(false);
    if (!camera) return;

    const screenshot = camera.getScreenshot();
    if (!screenshot) return;

    const buffer = Buffer.from(base64ToUint8Array(screenshot.split(",")[1]));
    setOriginalPhoto({
      uri: URL.createObjectURL(new Blob([buffer], { type: "buffer" })),
      buffer,
    });

    setShowCamera(false);
  };

  const retakePhoto = () => {
    setShowCamera(false);
    photo$.delete();
    setOriginalPhoto(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCropPixels(null);
    loading.stop();
  };

  return (
    <>
      <span className="my-4 flex w-full flex-col text-2xl font-semibold">
        {originalPhoto && !photo ? "Crop photo" : "Take Photo"}
        <div className="divider mt-4 w-2/3" />
      </span>

      <span className="pb-8">
        {originalPhoto && !photo
          ? "Make sure your face is centered and not rotated"
          : "The photo should include the face of the submitter facing the camera and the facial features must be visible"}
      </span>

      {!showCamera && !originalPhoto && !photo && (
        <div className="flex flex-col items-center">
          <div className="flex w-full flex-col pb-8 sm:flex-row">
            <div className="m-auto flex w-fit flex-col items-center">
              <span className="pb-2 font-semibold">Facing the camera</span>
              <div className="grid grid-cols-2 gap-2">
                <ExamplePic src="/images/front-facing.jpg" />
                <ExamplePic src="/images/not-front-facing.jpg" wrong={true} />
              </div>
            </div>

            <div className="m-auto flex w-fit flex-col items-center">
              <span className="pb-2 font-semibold">No filters</span>
              <div className="grid w-fit grid-cols-1">
                <ExamplePic src="/images/b&w.jpg" wrong={true} />
              </div>
            </div>
          </div>

          <div className="flex w-fit flex-col items-center">
            <span className="pb-2 font-semibold">
              All facial features must be visible
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ExamplePic src="/images/hijab.jpg" />
              <ExamplePic src="/images/niqab.jpg" wrong={true} />
              <ExamplePic src="/images/glasses.jpg" />
              <ExamplePic src="/images/sunglasses.jpg" wrong={true} />
            </div>

            <div className="flex w-fit flex-col items-center">
              <br />
              <span className="pb-2 font-semibold">
                Upload only in accepted formats (jpg, jpeg, png and webp) to
                avoid losing your deposit
              </span>
            </div>
          </div>

          <div className="bordered relative mt-12 grid w-full grid-cols-2">
            <Uploader
              className="bg-whiteBackground flex h-full items-center justify-center rounded p-2 outline-dotted outline-white"
              type="image"
              onDrop={async (received) => {
                const file = received[0];
                setOriginalPhoto({
                  uri: URL.createObjectURL(
                    new Blob([file], { type: file.type }),
                  ),
                  buffer: Buffer.from(await file.arrayBuffer()),
                });
              }}
              disabled={!!originalPhoto}
            >
              <div className="bg-orange mr-4 flex h-12 w-12 items-center justify-center rounded-full">
                <UploadIcon className="h-6 w-6" />
              </div>
              <span className="text-lg font-medium">Upload photo</span>
            </Uploader>

            <span className="bg-whiteBackground text-orange absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-200 p-1 text-xs font-semibold">
              OR
            </span>

            <button
              className="flex items-center justify-center p-2 text-lg text-white"
              onClick={() => setShowCamera(true)}
            >
              <div className="flex flex-col font-medium">
                <span>Take with</span>
                <span>camera</span>
              </div>
              <CameraIcon className="ml-4 h-12 fill-white" />
            </button>
          </div>
        </div>
      )}

      {showCamera && (
        <div tabIndex={0} ref={fullscreenRef}>
          <Webcam
            fullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            loadCamera={setCamera}
            action={takePhoto}
          />
        </div>
      )}

      {!showCamera && !!originalPhoto && !photo && (
        <>
          <div className="centered mx-12 mb-4">
            <ZoomIcon className="fill-theme mr-2 h-6 w-6" />
            <input
              className="slider-thumb h-0.5 w-full appearance-none bg-slate-200"
              type="range"
              min={1}
              max={maxZoom}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(parseFloat(event.target.value))}
            />
          </div>

          <div className="relative mb-2 h-96 w-full bg-slate-200">
            <Cropper
              image={originalPhoto?.uri}
              crop={crop}
              zoom={zoom}
              maxZoom={maxZoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onCropComplete={(_area, croppedPixels) => {
                setCropPixels(croppedPixels);
                if (
                  croppedPixels.width < MIN_DIMS.width ||
                  croppedPixels.height < MIN_DIMS.height
                ) {
                  toast.error(ERROR_MSG.dimensions);
                  console.error("Size error");
                }
              }}
              onZoomChange={setZoom}
              onMediaLoaded={(media) => {
                setMaxZoom(
                  Math.floor(
                    Math.min(media.naturalWidth, media.naturalHeight) / 256,
                  ),
                );
              }}
            />
          </div>

          {pending ? (
            <button className="btn-main">
              <Image
                alt="loading"
                src="/logo/poh-white.svg"
                className="animate-flip"
                height={12}
                width={12}
              />
              {loadingMessage}...
            </button>
          ) : (
            <button className="btn-main" onClick={onCrop}>
              <CheckmarkIcon className="mr-2 h-6 w-6 fill-white" />
              Ready
            </button>
          )}
        </>
      )}

      {!!photo && (
        <div className="flex flex-col items-center">
          <Previewed
            uri={photo.uri}
            trigger={
              <Image
                alt="preview"
                className="rounded-full"
                src={photo.uri}
                width={256}
                height={256}
              />
            }
          />
          <button className="btn-main mt-4" onClick={advance}>
            Next
          </button>
        </div>
      )}

      {(showCamera || !!originalPhoto || !!photo) && (
        <button
          className="centered text-orange mt-4 text-lg font-semibold uppercase"
          onClick={retakePhoto}
        >
          <ResetIcon className="fill-orange mr-2 h-6 w-6" />
          {showCamera ? "Return" : "Retake"}
        </button>
      )}
    </>
  );
}

export default Photo;
