import requests
import os

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_TRANSLATE_ROOT_URL = "https://translation.googleapis.com/language/translate/v2/"
GOOGLE_TRANSLATE_DETECT_URL = GOOGLE_TRANSLATE_ROOT_URL + "detect"


def detect_language(text: str) -> str:
    try:
        res = requests.post(
            GOOGLE_TRANSLATE_DETECT_URL,
            data={"q": text, "key": GOOGLE_API_KEY},
        ).json()
        if "data" in res:
            return res["data"][0]
        else:
            return "en"
    except Exception as e:
        return "en"


def translate_text(text: str, src_lang: str, target_lang: str) -> str:
    if src_lang == target_lang:
        return text
    try:
        res = requests.post(
            GOOGLE_TRANSLATE_ROOT_URL,
            data={"q": text, "source": src_lang, "target": target_lang, "key": GOOGLE_API_KEY},
        ).json()
        if "data" in res:
            return res["data"][0]
        else:
            return text
    except Exception as e:
        return text
