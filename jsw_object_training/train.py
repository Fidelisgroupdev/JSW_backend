from ultralytics import YOLO
import os, warnings, shutil, torch
from pathlib import Path

# ─── 1. Silence that annoying NumPy DLL warning ─────────────────────────────
warnings.filterwarnings(
    "ignore",
    message="loaded more than 1 DLL from .libs:",
    category=UserWarning,
    module="numpy._distributor_init"
)

# ─── Config ──────────────────────────────────────────────────────────────────
BASE_DIR   = 'Combined_CementBag_Dataset'
RUN_NAME   = 'cement_bags'
DATA_YAML  = os.path.join(BASE_DIR, 'data.yaml')
IMG_SIZE   = 416
BATCH      = 4
EPOCHS     = 100
DEVICE     = 0  # GPU 0
SAVE_PERIOD= 10
PATIENCE   = 50

def verify_dataset_structure():
    required = [
        'train/images', 'train/labels',
        'valid/images', 'valid/labels'
    ]
    print("\nVerifying dataset structure...")
    missing = False
    for d in required:
        p = os.path.join(BASE_DIR, d)
        ok = os.path.exists(p)
        print(f"  {p}: {'✓' if ok else '✗'}")
        if not ok: missing = True
    if missing:
        raise FileNotFoundError("Some required dataset directories are missing!")
    for d in required:
        cnt = len(os.listdir(os.path.join(BASE_DIR, d)))
        print(f"  {d}: {cnt} files")

def find_latest_checkpoint():
    """Return the latest <epoch>.pt under runs/detect/RUN_NAME/weights, or None."""
    wdir = Path('runs/detect')/RUN_NAME/'weights'
    if not wdir.exists():
        return None
    pts = list(wdir.glob('epoch*.pt'))
    if not pts:
        return None
    return str(max(pts, key=lambda x: int(x.stem.replace('epoch',''))))

def train_model():
    print("\n=== Starting Training Setup ===")
    verify_dataset_structure()

    resume_ckpt = find_latest_checkpoint()
    is_resume   = bool(resume_ckpt)
    if is_resume:
        print(f"→ Resuming from checkpoint: {resume_ckpt}")
    else:
        print("→ No checkpoint found, starting fresh from yolov8n.pt")

    model = YOLO(resume_ckpt) if is_resume else YOLO('yolov8n.pt')

    print("\nTraining parameters:")
    print(f"  epochs={EPOCHS}, img_size={IMG_SIZE}, batch={BATCH}")
    print(f"  resume={is_resume}, exist_ok={is_resume}\n")

    try:
        results = model.train(
            data=DATA_YAML,
            epochs=EPOCHS,
            imgsz=IMG_SIZE,
            batch=BATCH,
            name=RUN_NAME,
            device=DEVICE,
            patience=PATIENCE,
            save=True,
            save_period=SAVE_PERIOD,
            pretrained=True,
            optimizer='auto',
            verbose=True,
            seed=42,
            cache='disk',
            workers=2,
            exist_ok=is_resume,
            resume=is_resume
        )
        print("\n✅ Training completed")
        best = Path('runs/detect')/RUN_NAME/'weights'/'best.pt'
        if best.exists():
            shutil.copy(best, 'best.pt')
            print("🔖 Best model copied to ./best.pt")
        return True

    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        if 'model' in locals():
            try:
                torch.save(model.state_dict(), 'emergency_save.pt')
                print("⚠️ Emergency state saved to emergency_save.pt")
            except Exception:
                pass
        return False

if __name__ == "__main__":
    ok = train_model()
    print("\nDone." if ok else "\nTraining failed—check output above.")
