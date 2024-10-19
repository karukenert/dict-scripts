import PocketBase from "npm:pocketbase";

// TODO: pass by arguments
const INPUT_FILE = "./words.txt";
const LOCALE = "en";

const POCKETBASE_URL = Deno.env.get("POCKETBASE_URL")!;
const POCKETBASE_ADMIN_USERNAME = Deno.env.get("POCKETBASE_ADMIN_USERNAME")!;
const POCKETBASE_ADMIN_PASSWORD = Deno.env.get("POCKETBASE_ADMIN_PASSWORD")!;

if (
  ![POCKETBASE_URL, POCKETBASE_ADMIN_PASSWORD, POCKETBASE_ADMIN_USERNAME].every(
    Boolean,
  )
) {
  console.error(`ERROR: validate that env variables exist`);
  Deno.exit(1);
}

if (!LOCALE) {
  console.error(`ERROR: set locale`);
  Deno.exit(1);
}

const pb = new PocketBase(POCKETBASE_URL);
await pb.admins.authWithPassword(
  POCKETBASE_ADMIN_USERNAME,
  POCKETBASE_ADMIN_PASSWORD,
);

function readFile(filePath: string): string {
  try {
    const fileContent = Deno.readTextFileSync(filePath);

    return fileContent.toString();
  } catch (error) {
    console.error(
      `ERROR: unable to read file ${INPUT_FILE}, err: ${error}`,
    );
    Deno.exit(1);
  }
}

function prepareWord(wordRaw: string): string {
  return wordRaw.trim().toLowerCase();
}

const wordsData = readFile(INPUT_FILE);
const inputWordsRaw = wordsData.split(/\n/);

if (!inputWordsRaw.length) {
  console.error(`ERROR: No words present in input file ${INPUT_FILE}`);
  Deno.exit(1);
}

const existingWords = (await pb.collection("words").getFullList()).map((i) =>
  prepareWord(i.word)
);

const preparedWords = inputWordsRaw.map(prepareWord).filter((word) => {
  return word && !existingWords.includes(word);
});

// add words one by one
for await (const word of preparedWords) {
  await pb.collection("words").create({
    word,
    locale: LOCALE,
  });
  console.log(`Word "${word}" added to database`);
}

pb.authStore.clear();
