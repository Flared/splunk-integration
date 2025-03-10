from typing import Union


def prune_empty_fields(d: Union[dict, list]) -> Union[dict, list]:
    if isinstance(d, dict):
        return {
            k: prune_empty_fields(v)
            for k, v in d.items()
            if v not in (None, "", [], {}, ()) and prune_empty_fields(v) != {}
        }
    elif isinstance(d, list):
        return [
            prune_empty_fields(v)
            for v in d
            if v not in (None, "", [], {}, ()) and prune_empty_fields(v) != []
        ]
    else:
        return d
