from simpleeval import simple_eval
from .variable_resolver import resolve_config


def evaluate_condition(expression: str, context: dict) -> bool:
    """
        Evaluating run_if conditon 
    """
    resolved_expression = resolve_config(expression, context)

    try:
        result = simple_eval(resolved_expression)
        if not isinstance(result, bool):
            raise ValueError("Condition expression must evaluate to a boolean value.")
        return result
    except Exception as e:
        raise ValueError(f"Error evaluating condition '{expression}': {e}")
