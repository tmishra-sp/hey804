import requests
from server.config import GOOGLE_API_KEY

GOOGLE_TRANSLATE_ROOT_URL = "https://translation.googleapis.com/language/translate/v2/"
GOOGLE_TRANSLATE_DETECT_URL = GOOGLE_TRANSLATE_ROOT_URL + "detect"


def detect_language(text: str) -> str:
    if not GOOGLE_API_KEY:
        return "en"
    try:
        res = requests.post(
            GOOGLE_TRANSLATE_DETECT_URL,
            data={"q": text, "key": GOOGLE_API_KEY},
        ).json()
        if "data" in res:
            lang = res["data"]["detections"][0][0]["language"]
            return lang
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
            translated_text = res["data"]["translations"][0]["translatedText"]
            return translated_text
        else:
            return text
    except Exception as e:
        return text
