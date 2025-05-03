from ultralytics import YOLO
import os
import torch
import shutil
from pathlib import Path
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)

# Configuration
class Config:
    DATASET_DIR = "E:\\jsw_object_training\\Combined_CementBag_Dataset"
    MODEL = "yolov8n.pt"
    EPOCHS = 100
    IMG_SIZE = 640
    BATCH_SIZE = 4
    DEVICE = 0  # GPU 0
    PATIENCE = 50  # Early stopping patience
    SAVE_PERIOD = 10  # Save model every 10 epochs
    AMP = True  # Mixed precision training
    WORKERS = 4  # Number of data loading workers
    CACHE = "ram"  # Cache images in RAM for faster training
    AUGMENT = True  # Enable data augmentation
    OPTIMIZER = "auto"  # Automatic optimizer selection
    LR0 = 0.01  # Initial learning rate
    LRF = 0.01  # Final learning rate factor
    MOMENTUM = 0.937
    WEIGHT_DECAY = 0.0005
    WARMUP_EPOCHS = 3.0
    WARMUP_MOMENTUM = 0.8
    WARMUP_BIAS_LR = 0.1

def verify_dataset():
    """Verify dataset structure and integrity."""
    logging.info("Verifying dataset structure...")
    
    required_dirs = [
        f"{Config.DATASET_DIR}/train/images",
        f"{Config.DATASET_DIR}/train/labels",
        f"{Config.DATASET_DIR}/valid/images",
        f"{Config.DATASET_DIR}/valid/labels"
    ]
    
    # Check directories
    for dir_path in required_dirs:
        if not os.path.exists(dir_path):
            raise FileNotFoundError(f"Missing required directory: {dir_path}")
    
    # Check files
    train_images = list(Path(f"{Config.DATASET_DIR}/train/images").glob("*.jpg"))
    train_labels = list(Path(f"{Config.DATASET_DIR}/train/labels").glob("*.txt"))
    val_images = list(Path(f"{Config.DATASET_DIR}/valid/images").glob("*.jpg"))
    val_labels = list(Path(f"{Config.DATASET_DIR}/valid/labels").glob("*.txt"))
    
    logging.info(f"Training images: {len(train_images)}")
    logging.info(f"Training labels: {len(train_labels)}")
    logging.info(f"Validation images: {len(val_images)}")
    logging.info(f"Validation labels: {len(val_labels)}")
    
    if len(train_images) == 0 or len(val_images) == 0:
        raise ValueError("No images found in dataset")
    
    if len(train_images) != len(train_labels) or len(val_images) != len(val_labels):
        raise ValueError("Mismatch between number of images and labels")

def setup_training():
    """Setup training environment and create necessary directories."""
    logging.info("Setting up training environment...")
    
    # Create runs directory if it doesn't exist
    runs_dir = Path("runs/detect")
    runs_dir.mkdir(parents=True, exist_ok=True)
    
    # Create timestamped run directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = runs_dir / f"cement_bags_{timestamp}"
    run_dir.mkdir(exist_ok=True)
    
    return run_dir

def train_model():
    """Main training function with comprehensive error handling."""
    try:
        # Verify dataset
        verify_dataset()
        
        # Setup training environment
        run_dir = setup_training()
        
        # Initialize model
        logging.info("Initializing YOLOv8 model...")
        model = YOLO(Config.MODEL)
        
        # Training parameters
        train_args = {
            "data": f"{Config.DATASET_DIR}/data.yaml",
            "epochs": Config.EPOCHS,
            "imgsz": Config.IMG_SIZE,
            "batch": Config.BATCH_SIZE,
            "device": Config.DEVICE,
            "patience": Config.PATIENCE,
            "save_period": Config.SAVE_PERIOD,
            "amp": Config.AMP,
            "workers": Config.WORKERS,
            "cache": Config.CACHE,
            "augment": Config.AUGMENT,
            "optimizer": Config.OPTIMIZER,
            "lr0": Config.LR0,
            "lrf": Config.LRF,
            "momentum": Config.MOMENTUM,
            "weight_decay": Config.WEIGHT_DECAY,
            "warmup_epochs": Config.WARMUP_EPOCHS,
            "warmup_momentum": Config.WARMUP_MOMENTUM,
            "warmup_bias_lr": Config.WARMUP_BIAS_LR,
            "project": str(run_dir.parent),
            "name": run_dir.name,
            "exist_ok": True,
            "verbose": True
        }
        
        # Start training
        logging.info("Starting training...")
        logging.info(f"Training parameters: {train_args}")
        
        results = model.train(**train_args)
        
        # Save best model
        best_model_path = Path(run_dir) / "weights" / "best.pt"
        if best_model_path.exists():
            shutil.copy(best_model_path, "best_cement_bags.pt")
            logging.info("Best model saved as 'best_cement_bags.pt'")
        
        logging.info("Training completed successfully!")
        return True
        
    except Exception as e:
        logging.error(f"Training failed: {str(e)}")
        # Save emergency model state if possible
        if 'model' in locals():
            try:
                torch.save(model.state_dict(), "emergency_save.pt")
                logging.info("Emergency model state saved as 'emergency_save.pt'")
            except Exception as save_error:
                logging.error(f"Failed to save emergency model state: {str(save_error)}")
        return False

if __name__ == "__main__":
    logging.info("Starting cement bag detection training...")
    success = train_model()
    logging.info("Training completed successfully!" if success else "Training failed!") 