import { Question } from './types';

export const QUESTIONS_DATA: Record<string, Record<string, Question[]>> = {
  math: {
    easy: [
      { q: "2 + 2 = ?", a: ["3", "4", "5", "6"], correct: 1 },
      { q: "10 - 7 = ?", a: ["1","2","3","4"], correct: 2 },
      { q: "5 × 3 = ?", a: ["15", "10", "20", "12"], correct: 0 },
      { q: "15 ÷ 3 = ?", a: ["4", "5", "6", "7"], correct: 1 },
      { q: "7 + 6 = ?", a: ["12", "13", "14", "15"], correct: 1 },
      { q: "9 - 4 = ?", a: ["5", "4", "6", "3"], correct: 0 },
      { q: "8 × 2 = ?", a: ["14", "16", "18", "20"], correct: 1 },
      { q: "12 ÷ 4 = ?", a: ["2", "3", "4", "5"], correct: 1 },
      { q: "6 + 5 = ?", a: ["10", "11", "12", "13"], correct: 1 },
      { q: "3 × 7 = ?", a: ["20", "21", "19", "18"], correct: 1 },
      { q: "10 + 9 = ?", a: ["18", "19", "20", "21"], correct: 1 },
      { q: "14 - 6 = ?", a: ["7", "8", "9", "10"], correct: 1 },
      { q: "2 × 9 = ?", a: ["17", "18", "19", "16"], correct: 1 },
      { q: "8 ÷ 2 = ?", a: ["2", "3", "4", "5"], correct: 2 },
      { q: "11 + 4 = ?", a: ["14", "15", "16", "17"], correct: 1 }
    ],
    medium: [
      { q: "Solve for x: 2x + 5 = 13", a: ["3", "4", "5", "6"], correct: 1 },
      { q: "If x = 4, what is 3x - 2?", a: ["10", "11", "12", "13"], correct: 2 },
      { q: "Area of rectangle with length 5 and width 7?", a: ["30", "35", "40", "45"], correct: 1 },
      { q: "What is 15% of 200?", a: ["25", "30", "35", "40"], correct: 3 },
      { q: "Solve: 5x - 7 = 18", a: ["4", "5", "6", "7"], correct: 3 },
      { q: "The sum of two consecutive numbers is 19. What are the numbers?", a: ["9 & 10", "8 & 11", "10 & 9", "7 & 12"], correct: 0 },
      { q: "A triangle has base 10 and height 5. What is its area?", a: ["20", "25", "30", "15"], correct: 1 },
      { q: "Solve for y: 3y + 4 = 19", a: ["4", "5", "6", "7"], correct: 1 },
      { q: "What is the perimeter of a square with side 6?", a: ["18", "22", "24", "30"], correct: 2 },
      { q: "If 2x = 10, then x = ?", a: ["4", "5", "6", "8"], correct: 1 }
    ],
    hard: [
      { q: "Solve for x: 2x² - 8x + 6 = 0", a: ["1 or 3", "2 or 3", "1 or 2", "2 only"], correct: 0 },
      { q: "If f(x) = 3x + 2, what is f(5)?", a: ["15", "16", "17", "18"], correct: 2 },
      { q: "A triangle has sides 5, 12, 13. What is its area?", a: ["30", "60", "36", "50"], correct: 0 },
      { q: "Solve: 4(x-1)² = 16", a: ["1,5", "2,6", "0,4", "3,7"], correct: 2 },
      { q: "If 2^x = 16, what is x?", a: ["2", "3", "4", "5"], correct: 2 },
      { q: "Simplify: (x²y³)(2xy²)", a: ["2x³y⁵", "2x³y⁶", "2x²y⁵", "2x³y⁴"], correct: 0 },
      { q: "Solve for x: x² - 9x + 20 = 0", a: ["4 or 5", "5 or 4", "4 or 6", "5 or 6"], correct: 3 },
      { q: "If y = 2x + 3 and y = 7, find x.", a: ["1", "2", "3", "4"], correct: 1 },
      { q: "Factor: x² - 16", a: ["(x-4)(x+4)", "(x-8)(x+2)", "(x-2)(x+8)", "(x-1)(x+16)"], correct: 0 },
      { q: "Simplify: (3x²y)(4xy³)", a: ["12x³y⁴", "12x³y³", "7x³y⁴", "12x²y³"], correct: 0 }
    ]
  },
  english: {
    easy: [
      { q: "Choose the correct word: Their/There going to the store.", a: ["Their", "There", "They're", "The're"], correct: 2 },
      { q: "Select the correct spelling:", a: ["Accomodate", "Accommodate", "Acommodate", "Acomodate"], correct: 1 },
      { q: "Pick the right word: Its/It's raining outside.", a: ["Its", "It's", "Its'", "It is'"], correct: 1 },
      { q: "Choose the correct word: To/Too/Two many people came.", a: ["To", "Too", "Two", "Tooo"], correct: 1 },
      { q: "Select the correct sentence:", a: ["She don't like it.", "She doesn't like it.", "She not likes it.", "She doesn't likes it."], correct: 1 },
      { q: "Choose the best synonym for 'happy':", a: ["Sad", "Joyful", "Angry", "Tired"], correct: 1 },
      { q: "Pick the correct word: Affect/Effect of the storm was severe.", a: ["Affect", "Effect", "Affective", "Affected"], correct: 1 },
      { q: "Select the correct sentence:", a: ["I have went there.", "I have gone there.", "I has gone there.", "I go there."], correct: 1 },
      { q: "Choose the correct word: They're/Their going on vacation.", a: ["They're", "Their", "There", "The're"], correct: 0 },
      { q: "Pick the correct word: He did good/well on the test.", a: ["Good", "Well", "Welled", "Goods"], correct: 1 }
    ],
    medium: [
      { q: "Choose the best word to complete: Despite the rain, the picnic went on ___.", a: ["successfully", "successful", "success", "succession"], correct: 0 },
      { q: "Select the correct word: She was ___ to finish the project on time.", a: ["determined", "determine", "determines", "determination"], correct: 0 },
      { q: "Pick the best synonym for 'ambiguous':", a: ["clear", "vague", "obvious", "evident"], correct: 1 },
      { q: "Choose the correct sentence:", a: ["He is more smarter than his brother.", "He is smarter than his brother.", "He is smart than his brother.", "He is the most smarter than his brother."], correct: 1 },
      { q: "Select the correct word: The committee reached a ___ decision.", a: ["unanimous", "unique", "uniform", "unknown"], correct: 0 },
      { q: "Pick the correct word: Her explanation was ___ convincing.", a: ["very", "much", "too", "so"], correct: 0 },
      { q: "Choose the correct sentence:", a: ["Neither of the answers are correct.", "Neither of the answers is correct.", "Neither of the answers were correct.", "Neither of the answer is correct."], correct: 1 },
      { q: "Select the best synonym for 'meticulous':", a: ["careful", "sloppy", "lazy", "hasty"], correct: 0 },
      { q: "Pick the correct word: The scientist made a ___ discovery.", a: ["groundbreaking", "grounded", "ground", "groundedness"], correct: 0 },
      { q: "Choose the correct sentence:", a: ["He suggested to go early.", "He suggested going early.", "He suggested go early.", "He suggested gone early."], correct: 1 }
    ],
    hard: [
      { q: "Choose the most precise word: The scientist provided a ___ analysis of the data.", a: ["meticulous", "careless", "superficial", "ambiguous"], correct: 0 },
      { q: "Select the correct sentence:", a: ["Had I known about the test, I would have studied.", "If I knew about the test, I would have studied.", "Had I knew about the test, I would have studied.", "If I had knew about the test, I would have studied."], correct: 0 },
      { q: "Pick the best synonym for 'cogent':", a: ["convincing", "weak", "unpersuasive", "trivial"], correct: 0 },
      { q: "Choose the correct sentence:", a: ["No sooner had he arrived than the meeting started.", "No sooner he arrived than the meeting started.", "No sooner had he arrive than the meeting started.", "No sooner had he arriving than the meeting started."], correct: 0 },
      { q: "Select the best antonym for 'ephemeral':", a: ["lasting", "brief", "fleeting", "transient"], correct: 0 },
      { q: "Pick the correct word: The CEO emphasized the ___ necessity of innovation.", a: ["paramount", "minor", "negligible", "secondary"], correct: 0 },
      { q: "Choose the correct sentence:", a: ["Seldom have I witnessed such dedication.", "Seldom I have witnessed such dedication.", "Seldom have I witnessing such dedication.", "Seldom I witnessed such dedication."], correct: 0 },
      { q: "Select the best synonym for 'obfuscate':", a: ["confuse", "clarify", "explain", "illuminate"], correct: 0 },
      { q: "Pick the correct word: His argument was ___ persuasive, convincing the jury.", a: ["highly", "most", "very", "extremely"], correct: 0 },
      { q: "Choose the correct sentence:", a: ["Not only did she excel in math, but also in science.", "Not only she excelled in math, but also in science.", "Not only did she excel in math, but she excelled also in science.", "Not only she excelled in math, also in science."], correct: 0 }
    ]
  }
};
