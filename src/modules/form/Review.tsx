import { Zero } from "@ethersproject/constants";
import { formatEther, parseEther } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useContractData from "api/useContractData";
import DocumentIcon from "assets/svg/NoteMajor.svg";
import POHLogoWhite from "assets/svg/poh-logo-white.svg";
import ALink from "components/ALink";
import Field from "components/Field";
import Image from "components/Image";
import Label from "components/Label";
import TimeAgo from "components/TimeAgo";
import Video from "components/Video";
import useBalance from "hooks/useBalance";
import { useGasFees } from "hooks/useGasFees";
import { useLoading } from "hooks/useLoading";
import {
  useClaimHumanity,
  useRequestTotalCost,
} from "hooks/useProofOfHumanity";
import useWeb3 from "hooks/useWeb3";
import { EvidenceFile, RegistrationFile } from "types/docs";
import { machinifyId } from "utils/identifier";
import { ipfs, uploadToIPFS } from "utils/ipfs";
import { formatEth } from "utils/misc";
import { useFormContext } from "./context";
import useFormNavigate from "./useFormNavigate";

const Review: React.FC = () => {
  const { account } = useWeb3();
  const nav = useFormNavigate();
  const {
    state: { humanityId, name, bio, photo, video, videoType },
  } = useFormContext();
  const loading = useLoading();
  const claimHumanity = useClaimHumanity();
  const totalCost = useRequestTotalCost();
  const contractData = useContractData();

  const [selfFunded, setSelfFunded] = useState<number>(
    parseFloat(formatEther(totalCost || Zero))
  );
  const [estimatedGasFees, estimationError] = useGasFees(
    "claimHumanity(string,string)",
    [name, "ipfs/randomhashtoestimategasfees/evidence.json"]
  );
  const [ipfsUri, setIpfsUri] = useState<string>();
  const balance = useBalance();

  useEffect(() => {
    if (!name || !humanityId) return nav.toInfo();
    if (!photo) return nav.toPhoto();
    if (!videoType || !video) return nav.toVideo();
  }, []);

  useEffect(() => {
    if (totalCost) setSelfFunded(parseFloat(formatEther(totalCost || Zero)));
  }, [totalCost]);

  useEffect(() => {
    setIpfsUri("");
  }, [photo?.uri, video?.uri]);

  const submit = async () => {
    if (estimationError) {
      toast.error("Transaction would revert");
      return;
    }

    if (!photo || !video) return;

    let uri = ipfsUri;
    if (!uri) {
      loading.start("Uploading media to IPFS");

      const [photoUri, videoUri] = await Promise.all([
        uploadToIPFS(photo.content),
        uploadToIPFS(video.content),
      ]);

      loading.start("Uploading evidence files to IPFS");

      const fileURI = await uploadToIPFS(
        JSON.stringify({
          name,
          bio,
          videoType: videoType || undefined,
          photo: photoUri,
          video: videoUri,
        } as RegistrationFile),
        "file.json"
      );

      const evidenceUri = await uploadToIPFS(
        JSON.stringify({ fileURI, name: "Registration" } as EvidenceFile),
        "registration.json"
      );

      uri = evidenceUri;
      setIpfsUri(evidenceUri);
    }

    loading.start("Executing");

    if (humanityId)
      await claimHumanity(machinifyId(humanityId), uri, name, {
        value: parseEther(selfFunded.toString()),
      });

    loading.stop();
  };

  return (
    <>
      <span className="w-full my-4 flex flex-col text-2xl font-semibold">
        Finalize your registration
        <div className="divider mt-4 w-2/3" />
      </span>

      {contractData && (
        <div className="centered flex-col mb-4">
          <ALink
            className="flex mr-1 text-theme font-semibold"
            href={ipfs(contractData.latestArbitratorData.registrationMeta)}
          >
            <DocumentIcon className="w-6 h-6 fill-theme" />
            Registration Policy
          </ALink>
          <span className="text-sm text-slate-400">
            Updated:{" "}
            <TimeAgo
              time={contractData.latestArbitratorData.metaEvidenceUpdateTime}
            />
          </span>
        </div>
      )}

      <span className="txt pb-8">
        Check the uploaded files and make sure they are according to the rules:
        <ul className="list-disc ml-8">
          <li>
            Photo must be facing forward, without any covering that might hide
            facial features
          </li>
          <li>
            No filters, heavy makeup or adornments that might obscure the face,
            hats are okay
          </li>
          <li>Make sure the video follows the rules</li>
        </ul>
      </span>

      {photo && video && (
        <div className="w-full flex flex-col sm:flex-row items-center justify-center mx-auto">
          <Image uri={photo.uri} rounded previewed />
          <Video
            className="h-40 mt-4 sm:mt-0 sm:ml-8 cursor-pointer"
            uri={video.uri}
            previewed
          />
        </div>
      )}

      <div className="w-full flex flex-col">
        <Field label="Name" value={name || ""} disabled />
        <Field label="Account" value={account || ""} disabled />

        <Label>
          <div className="flex items-center">
            Initial deposit
            {balance && (
              <span className="ml-8 text-black">
                Your balance: <strong>{formatEth(balance)} ETH</strong>
              </span>
            )}
            {estimatedGasFees && (
              <span className="ml-8 text-black">
                Estimated gas fees:{" "}
                <strong>{formatEth(estimatedGasFees)} ETH</strong>
              </span>
            )}
          </div>
        </Label>
        <div className="txt flex flex-col mb-16">
          {totalCost && (
            <div className="inline-flex items-center">
              <div className="w-48 mr-2">
                <Field
                  type="number"
                  className="no-spinner text-right"
                  min={0}
                  max={formatEther(totalCost)}
                  step={0.01}
                  value={selfFunded}
                  onChange={(event) =>
                    setSelfFunded(parseFloat(event.target.value))
                  }
                />
              </div>
              /
              <span
                onClick={() =>
                  setSelfFunded(parseFloat(formatEther(totalCost)))
                }
                className="mx-1 text-theme font-semibold underline underline-offset-2 cursor-pointer"
              >
                {formatEther(totalCost)}
              </span>{" "}
              ETH
            </div>
          )}

          <span className="mt-2 text-blue-500">
            The deposit is reimbursed after successful registration, and lost
            after failure. Any amount not contributed now can be put up by
            crowdfunders later.
          </span>
        </div>
      </div>

      {loading.active ? (
        <button className="btn-main">
          <POHLogoWhite className="w-6 h-6 animate-flip fill-white" />
          {loading.message}...
        </button>
      ) : (
        <button className="btn-main" onClick={submit}>
          Submit
        </button>
      )}
    </>
  );
};

export default Review;
