import logging
import numpy as np
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)

try:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    HAS_OPTUNA = True
except ImportError:
    HAS_OPTUNA = False
    logger.warning("Optuna not installed. Hyperparameter tuning unavailable.")

from .model import LSTMModel
from .data_engine import NUM_FEATURES


class HyperparameterTuner:
    def __init__(self, n_trials: int = 20, quick_epochs: int = 30):
        self.n_trials = n_trials
        self.quick_epochs = quick_epochs

    def tune(self, X_train: np.ndarray, y_train: np.ndarray,
             X_val: np.ndarray, y_val: np.ndarray,
             window_size: int = 30) -> Dict:

        if not HAS_OPTUNA:
            logger.warning("Optuna not available, returning defaults")
            return self._default_params()

        def objective(trial):
            n_layers = trial.suggest_int("n_layers", 2, 3)
            units = []
            for i in range(n_layers):
                units.append(trial.suggest_categorical(f"lstm_units_{i}", [32, 64, 128]))
            units = tuple(units)

            dropouts = []
            for i in range(n_layers):
                dropouts.append(trial.suggest_float(f"dropout_{i}", 0.1, 0.4))
            dropouts = tuple(dropouts)

            lr = trial.suggest_float("learning_rate", 1e-4, 1e-2, log=True)
            batch_size = trial.suggest_categorical("batch_size", [16, 32, 64])

            model = LSTMModel(window_size=window_size, num_features=NUM_FEATURES)
            model.build_model_custom(
                lstm_units=units,
                dropout_rates=dropouts,
                learning_rate=lr
            )

            model.train(X_train, y_train, epochs=self.quick_epochs,
                       batch_size=batch_size, validation_split=0.1)

            metrics = model.evaluate(X_val, y_val)
            return metrics["rmse"]

        study = optuna.create_study(direction="minimize", sampler=optuna.samplers.TPESampler(seed=42))
        study.optimize(objective, n_trials=self.n_trials, show_progress_bar=False)

        best = study.best_params
        n_layers = best.get("n_layers", 3)
        lstm_units = tuple(best.get(f"lstm_units_{i}", [128, 64, 32][i]) for i in range(n_layers))
        dropouts = tuple(best.get(f"dropout_{i}", [0.2, 0.2, 0.3][i]) for i in range(n_layers))

        result = {
            "lstm_units": lstm_units,
            "dropout_rates": dropouts,
            "learning_rate": best.get("learning_rate", 0.0008),
            "batch_size": best.get("batch_size", 32),
            "best_rmse": study.best_value,
            "n_trials": len(study.trials)
        }

        logger.info(f"Hyperparameter tuning complete: {result}")
        return result

    def _default_params(self) -> Dict:
        return {
            "lstm_units": (128, 64, 32),
            "dropout_rates": (0.2, 0.2, 0.3),
            "learning_rate": 0.0008,
            "batch_size": 32,
            "best_rmse": None,
            "n_trials": 0
        }
