from utils import prune_empty_fields


class TestPruneEmptyFields:
    def test_empty_dict(self):
        assert prune_empty_fields({}) == {}

    def test_empty_list(self):
        assert prune_empty_fields([]) == []

    def test_dict_with_empty_values(self):
        assert prune_empty_fields({"a": None, "b": "", "c": [], "d": {}, "e": ()}) == {}

    def test_list_with_empty_values(self):
        assert prune_empty_fields([None, "", [], {}, ()]) == []

    def test_nested_dict_with_empty_values(self):
        assert prune_empty_fields({"a": {"b": None, "c": ""}, "d": "value"}) == {
            "d": "value"
        }

    def test_nested_list_with_empty_values(self):
        assert prune_empty_fields([["", None, []], "value"]) == ["value"]

    def test_complex_structure(self):
        data = {
            "a": {"b": None, "c": "", "d": {"e": {}}},
            "f": [None, "valid", "", [], {}],
            "g": "non_empty",
        }
        expected = {"f": ["valid"], "g": "non_empty"}
        assert prune_empty_fields(data) == expected

    def test_mixed_types(self):
        data = {
            "key1": "value",
            "key2": [None, "text", {}],
            "key3": {"subkey1": "", "subkey2": {}},
        }
        expected = {"key1": "value", "key2": ["text"]}
        assert prune_empty_fields(data) == expected

    def test_list_of_dicts(self):
        data = [{"a": "", "b": "valid"}, {"c": None, "d": "data"}, {}]
        expected = [{"b": "valid"}, {"d": "data"}]
        assert prune_empty_fields(data) == expected
