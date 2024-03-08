import usePoHWrite from "contracts/hooks/usePoHWrite";
import { Address, Hash } from "viem";
import { useMemo } from "react";
import { useLoading } from "hooks/useLoading";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { toast } from "react-toastify";
import { useEffectOnce } from "@legendapp/state/react";

enableReactUse();

interface RemoveVouchProps {
  pohId: Hash;
  requester: Address;
}

export default function RemoveVouch({ pohId, requester }: RemoveVouchProps) {
  const loading = useLoading();
  const [pending] = loading.use();

  const [prepareRemoveVouch, removeOnchainVouch] = usePoHWrite(
    "removeVouch",
    useMemo(
      () => ({
        onError() {
          toast.error("Transaction rejected");
        },
        onLoading() {
          loading.start();
          toast.info("Transaction pending");
        },
        onSuccess() {
          toast.success("Request remove vouch successful");
        },
      }),
      [loading]
    )
  );
    
  useEffectOnce(() => {
    prepareRemoveVouch({ args: [requester, pohId] });
  });

  return (
    <div className="flex gap-4">
      <button
        disabled={pending}
        className="btn-main mb-2"
        onClick={removeOnchainVouch}
      >
        Remove Vouch
      </button>
    </div>
  );
};
