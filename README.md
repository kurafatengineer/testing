# UPSC Test Series Telegram Bot

यह बॉट हर 30 मिनट में https://upscpdf.com/feed/ चेक करता है और **Prelims TEST Series** की नई (साल 2027 वाली) पोस्ट की PDF आपके Telegram पर भेज देता है।
सब कुछ GitHub Actions पर मुफ़्त चलता है — कोई सर्वर या `pip install` नहीं चाहिए।

## यह कैसे काम करता है

1. फ़ीड पढ़ता है और सिर्फ़ वही पोस्ट रखता है जिनकी category में `Prelims TEST Series` हो और title में `2027` हो।
2. पोस्ट के अंदर से Google Drive की फ़ाइल लिंक (`drive.google.com/file/d/...`) और फ़ोल्डर लिंक निकालता है।
3. हर फ़ाइल डाउनलोड करता है। अगर वह असली PDF है और 50 MB से छोटी है, तो Telegram पर **फ़ाइल** भेजता है (caption में पोस्ट का title और लिंक)।
   डाउनलोड न हो पाए या फ़ाइल बड़ी हो, तो Drive का लिंक **मैसेज** में भेजता है। फ़ोल्डर लिंक भी मैसेज में आते हैं।
4. भेजी गई पोस्ट `seen.json` में लिख दी जाती है, ताकि दोबारा न आए।
   **पहली बार** चलने पर सिर्फ़ 2 सबसे नई पोस्ट भेजी जाती हैं, बाकी पुरानी "देखी हुई" मान ली जाती हैं।

## सेटअप (एक बार करना है)

### चरण 1 — @BotFather से बॉट बनाइए

1. Telegram में **@BotFather** खोलिए और `/newbot` भेजिए।
2. बॉट का नाम दीजिए (जैसे `UPSC PDF Alerts`), फिर username दीजिए जो `bot` पर ख़त्म हो (जैसे `my_upsc_pdf_bot`)।
3. BotFather एक **token** देगा, कुछ ऐसा: `1234567890:AAH...xyz`। इसे संभाल कर रखिए और किसी को मत दिखाइए।

### चरण 2 — अपना Chat ID निकालिए

1. अपने नए बॉट को Telegram में खोलिए और **Start** दबाइए, फिर कोई भी मैसेज भेजिए (जैसे `hi`)।
2. ब्राउज़र में यह खोलिए (`<TOKEN>` की जगह अपना token लगाइए):

   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

3. जवाब में `"chat":{"id":123456789, ...}` ढूँढिए। यही नंबर आपका **Chat ID** है।
   - अगर `"result":[]` (ख़ाली) आए, तो बॉट को एक और मैसेज भेजकर पेज refresh कीजिए।
   - **ग्रुप** में भेजना हो: बॉट को ग्रुप में add कीजिए, ग्रुप में एक मैसेज भेजिए, फिर getUpdates खोलिए। ग्रुप का ID `-` से शुरू होता है (जैसे `-1001234567890`)।
   - **चैनल** में भेजना हो: बॉट को चैनल का admin बनाइए; Chat ID `-100...` वाला होगा।

### चरण 3 — रिपॉज़िटरी में दो Secrets जोड़िए

1. GitHub पर इस repo में जाइए: **Settings → Secrets and variables → Actions**।
2. **New repository secret** दबाइए और ये दो secret बनाइए:

   | Name | Value |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | BotFather वाला token |
   | `TELEGRAM_CHAT_ID` | चरण 2 वाला Chat ID |

Token और Chat ID कोड में कहीं नहीं लिखे हैं — वे सिर्फ़ इन secrets से आते हैं।

### चरण 4 — पहली बार Actions टैब से चलाइए

1. repo में **Actions** टैब खोलिए। अगर workflows बंद दिखें तो **"I understand my workflows, go ahead and enable them"** दबाइए।
2. बाईं तरफ़ **Check UPSC feed** चुनिए।
3. **Run workflow** → **Run workflow** दबाइए।
4. एक मिनट में run हरा (✓) हो जाना चाहिए और Telegram पर 2 सबसे नई पोस्ट आ जानी चाहिए। run खोलकर **Run bot** step में पूरा log देख सकते हैं।
5. इसके बाद यह अपने-आप हर 30 मिनट में चलेगा और repo में `seen.json` अपडेट करता रहेगा।

## सेटिंग्स बदलना (वैकल्पिक)

**Settings → Secrets and variables → Actions → Variables** टैब में ये variables बना सकते हैं:

| Variable | मतलब | डिफ़ॉल्ट |
|---|---|---|
| `YEAR` | title में कौन-सा साल होना चाहिए | `2027` |
| `LANGUAGE` | `hindi` = सिर्फ़ Hindi वाली पोस्ट, `english` = बाकी सब, ख़ाली = दोनों | ख़ाली |

सब कुछ फिर से शुरू से भेजना हो तो repo से `seen.json` डिलीट कर दीजिए — अगला run फिर "पहला run" माना जाएगा।

## अपने कंप्यूटर पर टेस्ट करना

सिर्फ़ Python 3.12 चाहिए:

```bash
# Telegram को कुछ नहीं भेजता, कुछ डाउनलोड नहीं करता, seen.json नहीं बदलता
python bot.py --dry-run

# लाइव फ़ीड की जगह लोकल फ़ाइल से
FEED_FILE=tests/sample_feed.xml python bot.py --dry-run
```

## ध्यान देने वाली बातें

- GitHub का cron कभी-कभी कुछ मिनट देर से चलता है — यह सामान्य है।
- अगर repo में 60 दिन तक कोई commit न हो, तो GitHub scheduled workflow बंद कर देता है। तब Actions टैब से उसे फिर **Enable** कर दीजिए।
- Drive की कोई फ़ाइल private हो या उसकी download limit ख़त्म हो गई हो, तो बॉट फ़ाइल की जगह Drive लिंक भेज देगा।
