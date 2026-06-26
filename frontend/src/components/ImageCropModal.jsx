import { useRef } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./ImageCropModal.css";

export default function ImageCropModal({
  image,
  onCancel,
  onSave,
}) {
  const cropperRef = useRef(null);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">

      <div className="bg-slate-900 border border-white/10 rounded-2xl w-[500px] p-6">

        <h2 className="text-xl text-white font-semibold mb-5">
          Crop Profile Photo
        </h2>

        <div className="relative h-[450px] w-full overflow-hidden rounded-2xl bg-black">

  <Cropper
  className="profile-cropper"
  src={image}
  style={{
    height: "100%",
    width: "100%",
  }}
  initialAspectRatio={1}
  aspectRatio={1}
  viewMode={1}
  dragMode="move"
  guides={false}
  background={false}
  responsive={true}
  autoCropArea={1}
  checkOrientation={false}
  cropBoxMovable={false}
  cropBoxResizable={false}
  toggleDragModeOnDblclick={false}
  wheelZoomRatio={0.15}
  minCropBoxWidth={200}
  minCropBoxHeight={200}
  ref={cropperRef}
/>

</div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
          >
            Cancel
          </button>

          <button
  onClick={() => {
    const cropper = cropperRef.current?.cropper;

    if (!cropper) return;

    const croppedImage = cropper
      .getCroppedCanvas({
        width: 500,
        height: 500,
        imageSmoothingQuality: "high",
      })
      .toDataURL("image/png");

    onSave(croppedImage);
  }}
  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white"
>
  Upload
</button>

        </div>

      </div>

    </div>
  );
}