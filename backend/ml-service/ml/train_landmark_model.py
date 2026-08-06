"""
TravelIO — CNN Landmark Model Training Script
Trains MobileNetV2 on Indian-monuments dataset.
"""
import os
import sys
import json
import tensorflow as tf
from keras.applications import MobileNetV2
from keras.layers import Dense, GlobalAveragePooling2D, Dropout
from keras.models import Model
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelio.settings')
django.setup()

from django.conf import settings

# --- CONFIGURATION ---
DATASET_DIR = os.path.join(settings.BASE_DIR, '..', 'Indian-monuments', 'images')
TRAIN_DIR = os.path.join(DATASET_DIR, 'train')
TEST_DIR = os.path.join(DATASET_DIR, 'test')

MODELS_DIR = os.path.join(settings.BASE_DIR, 'ml', 'models')
MODEL_SAVE_PATH = os.path.join(MODELS_DIR, 'wanderiq_landmark_cnn.h5')
CLASSES_SAVE_PATH = os.path.join(MODELS_DIR, 'landmark_classes.json')

BATCH_SIZE = 32
IMG_SIZE = (224, 224)
EPOCHS = 3


def build_and_train():
    if not os.path.exists(TRAIN_DIR):
        print(f"[Error] Training directory not found: {TRAIN_DIR}")
        return

    os.makedirs(MODELS_DIR, exist_ok=True)
    print(f"Num GPUs Available: {len(tf.config.list_physical_devices('GPU'))}")

    print("Preparing datasets...")
    train_ds = tf.keras.utils.image_dataset_from_directory(
        TRAIN_DIR, image_size=IMG_SIZE, batch_size=BATCH_SIZE, label_mode='categorical'
    )
    validation_ds = tf.keras.utils.image_dataset_from_directory(
        TEST_DIR, image_size=IMG_SIZE, batch_size=BATCH_SIZE, label_mode='categorical'
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Found {num_classes} landmark classes.")

    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomRotation(0.055),
        tf.keras.layers.RandomTranslation(height_factor=0.2, width_factor=0.2, fill_mode='nearest'),
        tf.keras.layers.RandomFlip("horizontal"),
    ])

    def preprocess_train(images, labels):
        images = data_augmentation(images)
        images = tf.keras.applications.mobilenet_v2.preprocess_input(images)
        return images, labels

    def preprocess_val(images, labels):
        images = tf.keras.applications.mobilenet_v2.preprocess_input(images)
        return images, labels

    train_generator = train_ds.map(preprocess_train, num_parallel_calls=tf.data.AUTOTUNE)
    validation_generator = validation_ds.map(preprocess_val, num_parallel_calls=tf.data.AUTOTUNE)
    
    train_generator = train_generator.prefetch(buffer_size=tf.data.AUTOTUNE)
    validation_generator = validation_generator.prefetch(buffer_size=tf.data.AUTOTUNE)

    print("Loading MobileNetV2 base model...")
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy', metrics=['accuracy']
    )

    print(f"Starting training for {EPOCHS} epochs...")
    model.fit(train_generator, epochs=EPOCHS, validation_data=validation_generator)

    print("Saving model...")
    model.save(MODEL_SAVE_PATH)

    class_dict = {str(i): name for i, name in enumerate(class_names)}
    with open(CLASSES_SAVE_PATH, 'w') as f:
        json.dump(class_dict, f, indent=4)

    print(f"Training complete! Files saved to:\n- {MODEL_SAVE_PATH}\n- {CLASSES_SAVE_PATH}")


if __name__ == '__main__':
    build_and_train()
