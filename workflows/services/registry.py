from abc import ABC, abstractmethod

class BaseStepRunner(ABC):

    def __init__(self, config: dict, context: dict):
        self.config = config
        self.context = context

    @abstractmethod
    def execute(self):
        # all specific step runners must overwrite this 
        # config and context are just dictionaries
        pass

    def validate(self):
        pass

# mapping for step to class which handles it 
STEP_REGISTRY = {}


# this fxn maps step to respective class which handles this step
def get_runner_class(step_type: str):
    runner_class = STEP_REGISTRY.get(step_type)

    if not runner_class:
        raise ValueError(f"Unknown step type: {step_type}")
    return runner_class
