import re    # for regex 



# recursive funnction to find variables in config
def resolve_config(config, context):

    if isinstance(config, dict):
        return { key : resolve_config(value, context) for key, value in config.items()}
    
    if isinstance(config, list):
        return [ resolve_config(listElement, context) for listElement in config]
    
    if isinstance(config,str):
        return replace_variables(config, context)
    
    return config


# replaces variables with resolved value    
def replace_variables(text, context):
    text= text.strip()
    pattern = r"\{\{(.*?)\}\}"
    matches = re.findall(pattern, text)

    if not matches:
        return text

    for match in matches:
        resolved_value = resolve_path(match, context)

        if text == f"{{{{{match}}}}}":
            return resolved_value
        
        text = text.replace(f"{{{{{match}}}}}", str(resolved_value))

    return text
    

# resolves sub paths in context like converting step.1.id to context['steps']['1']['id'] 
def resolve_path(path, context):

    current = context
    pathsplit= path.strip().split('.')
    for key in pathsplit:
        if isinstance(current,dict) and key in current:
            current= current[key]
        else:
            raise ValueError(f"Invalid variabe reference: {path}")
   
    return current


