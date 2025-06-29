export const languageOptions = [
  { code: "tr", name: "Turkish" },
  { code: "en", name: "English" },
  { code: "nl", name: "Dutch" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
];

export const levelOptions = [
  { code: "", name: "No Level" },
  { code: "A1", name: "A1 (Beginner)" },
  { code: "A2", name: "A2 (Elementary)" },
  { code: "B1", name: "B1 (Pre-Intermediate)" },
  { code: "B2", name: "B2 (Intermediate)" },
  { code: "C1", name: "C1 (Advanced)" },
  { code: "C2", name: "C2 (Proficient)" },
];

export const storyTypeOptions = [
  { code: "normal", name: "Normal Story" },
  { code: "short", name: "Short Story" },
  { code: "long", name: "Long Story" },
  { code: "summary", name: "Summary" },
  { code: "fairy_tale", name: "Fairy Tale" },
  { code: "fable", name: "Fable" },
  { code: "poem", name: "Poem" },
  { code: "informative", name: "Informative Text" },
];

export const ageGroupOptions = [
  { code: "", name: "Select Age Group" },
  { code: "0-2", name: "0-2 (Babies)" },
  { code: "3-5", name: "3-5 (Preschool)" },
  { code: "6-8", name: "6-8 (Early Primary)" },
  { code: "9-12", name: "9-12 (Primary-Middle)" },
  { code: "13-15", name: "13-15 (Teen)" },
  { code: "16-18", name: "16-18 (High School)" },
  { code: "adult", name: "Adult" },
];

export const genreOptions = [
  { code: "", name: "Select Genre" },
  { code: "adventure", name: "Adventure" },
  { code: "fantasy", name: "Fantasy" },
  { code: "sci_fi", name: "Science Fiction" },
  { code: "romance", name: "Romance" },
  { code: "mystery", name: "Mystery/Crime" },
  { code: "historical", name: "Historical" },
  { code: "comedy", name: "Comedy" },
  { code: "drama", name: "Drama" },
  { code: "horror", name: "Horror" },
  { code: "fairy_tale", name: "Fairy Tale/Fable" },
  { code: "biography", name: "Biography" },
  { code: "educational", name: "Educational" },
  { code: "other", name: "Other" },
];

export const generationOptions = {
  languageOptions,
  levelOptions,
  storyTypeOptions,
  ageGroupOptions,
  genreOptions,
};
