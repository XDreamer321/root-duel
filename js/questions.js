/**
 * ROOT DUEL - Math Question Generator & Database
 * Provides 200+ curated questions + procedural generation across all categories and difficulty tiers.
 * Guarantees integer results, LaTeX formatting, and clean Unicode fallbacks.
 */

class QuestionManager {
    constructor() {
        this.handcraftedBank = this.initHandcraftedBank();
        this.usedQuestionHashes = new Set();
    }

    resetSession() {
        this.usedQuestionHashes.clear();
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Get a question based on category and difficulty.
     * Category: 'roots_sq' | 'roots_cb' | 'powers' | 'expressions' | 'mixed'
     * Difficulty: 'easy' | 'normal' | 'hard'
     */
    generateQuestion(category = 'roots_sq', difficulty = 'normal') {
        let actualCategory = category;
        if (category === 'mixed') {
            actualCategory = this.randomChoice(['roots_sq', 'roots_cb', 'powers', 'expressions']);
        }

        let q = null;
        let attempts = 0;

        while (attempts < 60) {
            attempts++;
            // 50% chance to pick from handcrafted bank, 50% procedural
            if (Math.random() < 0.5) {
                const candidates = this.handcraftedBank.filter(
                    item => (category === 'mixed' || item.category === actualCategory) && item.difficulty === difficulty
                );
                if (candidates.length > 0) {
                    const picked = this.randomChoice(candidates);
                    if (!this.usedQuestionHashes.has(picked.latex)) {
                        this.usedQuestionHashes.add(picked.latex);
                        return picked;
                    }
                }
            }

            // Procedural generation
            q = this.generateProcedural(actualCategory, difficulty);
            if (q && !this.usedQuestionHashes.has(q.latex)) {
                this.usedQuestionHashes.add(q.latex);
                return q;
            }
        }

        // Fallback procedural
        return this.generateProcedural(actualCategory, difficulty);
    }

    generateProcedural(category, difficulty) {
        switch (category) {
            case 'roots_sq':
                return this.generateSquareRoot(difficulty);
            case 'roots_cb':
                return this.generateCubeRoot(difficulty);
            case 'powers':
                return this.generatePower(difficulty);
            case 'expressions':
                return this.generateExpression(difficulty);
            default:
                return this.generateSquareRoot(difficulty);
        }
    }

    generateSquareRoot(difficulty) {
        let n;
        if (difficulty === 'easy') {
            n = this.randomInt(1, 12); // 1 to 12
        } else if (difficulty === 'normal') {
            n = this.randomInt(13, 22); // 13 to 22
        } else {
            n = this.randomInt(23, 35); // 23 to 35
        }

        const square = n * n;
        return {
            category: 'roots_sq',
            difficulty: difficulty,
            latex: `\\sqrt{${square}}`,
            unicode: `√${square}`,
            answer: n,
            hint: `${n} × ${n} = ${square}`
        };
    }

    generateCubeRoot(difficulty) {
        let n;
        if (difficulty === 'easy') {
            n = this.randomInt(1, 5); // 1 to 5
        } else if (difficulty === 'normal') {
            n = this.randomInt(6, 11); // 6 to 11
        } else {
            // Hard includes negative cubes or larger values
            const allowNegative = Math.random() < 0.45;
            const mag = this.randomInt(6, 14);
            n = allowNegative ? -mag : mag;
        }

        const cube = n * n * n;
        const dispCube = cube < 0 ? `(${cube})` : `${cube}`;
        return {
            category: 'roots_cb',
            difficulty: difficulty,
            latex: `\\sqrt[3]{${cube}}`,
            unicode: `∛${dispCube}`,
            answer: n,
            hint: `${n}³ = ${cube}`
        };
    }

    generatePower(difficulty) {
        let base, exp;
        if (difficulty === 'easy') {
            const type = this.randomChoice(['square', 'small_cube', 'base2']);
            if (type === 'square') {
                base = this.randomInt(2, 10);
                exp = 2;
            } else if (type === 'small_cube') {
                base = this.randomInt(2, 4);
                exp = 3;
            } else {
                base = 2;
                exp = this.randomInt(1, 5);
            }
        } else if (difficulty === 'normal') {
            const type = this.randomChoice(['square', 'base2', 'base3', 'cube']);
            if (type === 'square') {
                base = this.randomInt(11, 16);
                exp = 2;
            } else if (type === 'base2') {
                base = 2;
                exp = this.randomInt(6, 8);
            } else if (type === 'base3') {
                base = 3;
                exp = this.randomInt(3, 5);
            } else {
                base = this.randomInt(4, 6);
                exp = 3;
            }
        } else {
            const type = this.randomChoice(['power4', 'base2', 'squares', 'base5', 'negative']);
            if (type === 'base2') {
                base = 2;
                exp = this.randomChoice([9, 10]);
            } else if (type === 'power4') {
                base = this.randomInt(2, 4);
                exp = 4;
            } else if (type === 'base5') {
                base = 5;
                exp = this.randomChoice([3, 4]);
            } else if (type === 'negative') {
                base = -2;
                exp = this.randomChoice([3, 4, 5]);
            } else {
                base = this.randomInt(17, 25);
                exp = 2;
            }
        }

        const answer = Math.pow(base, exp);
        const dispBase = base < 0 ? `(${base})` : `${base}`;
        return {
            category: 'powers',
            difficulty: difficulty,
            latex: `${dispBase}^{${exp}}`,
            unicode: `${dispBase}^${exp}`,
            answer: answer,
            hint: `${dispBase} в степени ${exp} = ${answer}`
        };
    }

    generateExpression(difficulty) {
        if (difficulty === 'easy') {
            // e.g. √16 + 5 or √36 - 2
            const r = this.randomInt(2, 9);
            const sq = r * r;
            const op = this.randomChoice(['+', '-']);
            const addend = this.randomInt(1, 9);
            const answer = op === '+' ? r + addend : r - addend;

            return {
                category: 'expressions',
                difficulty: 'easy',
                latex: `\\sqrt{${sq}} ${op} ${addend}`,
                unicode: `√${sq} ${op} ${addend}`,
                answer: answer,
                hint: `√${sq} = ${r}, ${r} ${op} ${addend} = ${answer}`
            };
        } else if (difficulty === 'normal') {
            // e.g. √81 + √49, √144 / 3, 2 * √64, Pythagorean
            const type = this.randomChoice(['two_roots', 'mult_root', 'div_root', 'pythagorean']);
            if (type === 'pythagorean') {
                const triples = [
                    [3, 4, 5],
                    [6, 8, 10],
                    [5, 12, 13],
                    [8, 15, 17]
                ];
                const [a, b, c] = this.randomChoice(triples);
                return {
                    category: 'expressions',
                    difficulty: 'normal',
                    latex: `\\sqrt{${a}^2 + ${b}^2}`,
                    unicode: `√(${a}² + ${b}²)`,
                    answer: c,
                    hint: `√(${a*a} + ${b*b}) = √${c*c} = ${c} (теорема Пифагора)`
                };
            } else if (type === 'two_roots') {
                const r1 = this.randomInt(3, 12);
                const r2 = this.randomInt(2, 10);
                const op = this.randomChoice(['+', '-']);
                const ans = op === '+' ? r1 + r2 : r1 - r2;
                return {
                    category: 'expressions',
                    difficulty: 'normal',
                    latex: `\\sqrt{${r1*r1}} ${op} \\sqrt{${r2*r2}}`,
                    unicode: `√${r1*r1} ${op} √${r2*r2}`,
                    answer: ans,
                    hint: `${r1} ${op} ${r2} = ${ans}`
                };
            } else if (type === 'mult_root') {
                const mult = this.randomInt(2, 5);
                const r = this.randomInt(3, 9);
                return {
                    category: 'expressions',
                    difficulty: 'normal',
                    latex: `${mult} \\cdot \\sqrt{${r*r}}`,
                    unicode: `${mult} × √${r*r}`,
                    answer: mult * r,
                    hint: `${mult} × ${r} = ${mult * r}`
                };
            } else {
                const r = this.randomInt(2, 6) * 2; // even root
                const div = 2;
                return {
                    category: 'expressions',
                    difficulty: 'normal',
                    latex: `\\frac{\\sqrt{${r*r}}}{${div}}`,
                    unicode: `√${r*r} ÷ ${div}`,
                    answer: r / div,
                    hint: `${r} ÷ ${div} = ${r / div}`
                };
            }
        } else {
            // HARD: Pythagorean, bracket div, cube + sq, power diff
            const type = this.randomChoice(['bracket_div', 'cube_plus_sq', 'pythagorean_hard', 'power_diff']);
            if (type === 'pythagorean_hard') {
                const triples = [
                    [10, 8, 6],
                    [13, 12, 5],
                    [17, 15, 8],
                    [25, 24, 7],
                    [25, 20, 15]
                ];
                const [hyp, leg1, leg2] = this.randomChoice(triples);
                return {
                    category: 'expressions',
                    difficulty: 'hard',
                    latex: `\\sqrt{${hyp}^2 - ${leg1}^2}`,
                    unicode: `√(${hyp}² - ${leg1}²)`,
                    answer: leg2,
                    hint: `√(${hyp*hyp} - ${leg1*leg1}) = √${leg2*leg2} = ${leg2}`
                };
            } else if (type === 'bracket_div') {
                const div = this.randomChoice([2, 4, 5]);
                const ans = this.randomInt(2, 8);
                const total = ans * div;
                const r1 = this.randomInt(2, total - 2);
                const r2 = total - r1;
                return {
                    category: 'expressions',
                    difficulty: 'hard',
                    latex: `\\frac{\\sqrt{${r1*r1}} + \\sqrt{${r2*r2}}}{${div}}`,
                    unicode: `(√${r1*r1} + √${r2*r2}) ÷ ${div}`,
                    answer: ans,
                    hint: `(${r1} + ${r2}) ÷ ${div} = ${total} ÷ ${div} = ${ans}`
                };
            } else if (type === 'cube_plus_sq') {
                const c = this.randomInt(2, 6);
                const s = this.randomInt(3, 12);
                const op = this.randomChoice(['+', '-']);
                const ans = op === '+' ? c + s : c - s;
                return {
                    category: 'expressions',
                    difficulty: 'hard',
                    latex: `\\sqrt[3]{${c*c*c}} ${op} \\sqrt{${s*s}}`,
                    unicode: `∛${c*c*c} ${op} √${s*s}`,
                    answer: ans,
                    hint: `${c} ${op} ${s} = ${ans}`
                };
            } else {
                // Power difference e.g. 5² - 4² = 9
                const a = this.randomInt(4, 7);
                const b = a - 1;
                const diff = (a*a) - (b*b);
                return {
                    category: 'expressions',
                    difficulty: 'hard',
                    latex: `${a}^2 - ${b}^2`,
                    unicode: `${a}² - ${b}²`,
                    answer: diff,
                    hint: `${a*a} - ${b*b} = ${diff}`
                };
            }
        }
    }

    initHandcraftedBank() {
        return [
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{0}",
                "unicode": "√0",
                "answer": 0,
                "hint": "0² = 0"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{1}",
                "unicode": "√1",
                "answer": 1,
                "hint": "1² = 1"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{4}",
                "unicode": "√4",
                "answer": 2,
                "hint": "2² = 4"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{9}",
                "unicode": "√9",
                "answer": 3,
                "hint": "3² = 9"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{16}",
                "unicode": "√16",
                "answer": 4,
                "hint": "4² = 16"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{25}",
                "unicode": "√25",
                "answer": 5,
                "hint": "5² = 25"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{36}",
                "unicode": "√36",
                "answer": 6,
                "hint": "6² = 36"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{49}",
                "unicode": "√49",
                "answer": 7,
                "hint": "7² = 49"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{64}",
                "unicode": "√64",
                "answer": 8,
                "hint": "8² = 64"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{81}",
                "unicode": "√81",
                "answer": 9,
                "hint": "9² = 81"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{100}",
                "unicode": "√100",
                "answer": 10,
                "hint": "10² = 100"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{121}",
                "unicode": "√121",
                "answer": 11,
                "hint": "11² = 121"
        },
        {
                "category": "roots_sq",
                "difficulty": "easy",
                "latex": "\\sqrt{144}",
                "unicode": "√144",
                "answer": 12,
                "hint": "12² = 144"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{169}",
                "unicode": "√169",
                "answer": 13,
                "hint": "13² = 169"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{196}",
                "unicode": "√196",
                "answer": 14,
                "hint": "14² = 196"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{225}",
                "unicode": "√225",
                "answer": 15,
                "hint": "15² = 225"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{256}",
                "unicode": "√256",
                "answer": 16,
                "hint": "16² = 256"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{289}",
                "unicode": "√289",
                "answer": 17,
                "hint": "17² = 289"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{324}",
                "unicode": "√324",
                "answer": 18,
                "hint": "18² = 324"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{361}",
                "unicode": "√361",
                "answer": 19,
                "hint": "19² = 361"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{400}",
                "unicode": "√400",
                "answer": 20,
                "hint": "20² = 400"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{441}",
                "unicode": "√441",
                "answer": 21,
                "hint": "21² = 441"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{484}",
                "unicode": "√484",
                "answer": 22,
                "hint": "22² = 484"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{529}",
                "unicode": "√529",
                "answer": 23,
                "hint": "23² = 529"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{576}",
                "unicode": "√576",
                "answer": 24,
                "hint": "24² = 576"
        },
        {
                "category": "roots_sq",
                "difficulty": "normal",
                "latex": "\\sqrt{625}",
                "unicode": "√625",
                "answer": 25,
                "hint": "25² = 625"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{676}",
                "unicode": "√676",
                "answer": 26,
                "hint": "26² = 676"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{729}",
                "unicode": "√729",
                "answer": 27,
                "hint": "27² = 729"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{784}",
                "unicode": "√784",
                "answer": 28,
                "hint": "28² = 784"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{841}",
                "unicode": "√841",
                "answer": 29,
                "hint": "29² = 841"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{900}",
                "unicode": "√900",
                "answer": 30,
                "hint": "30² = 900"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{961}",
                "unicode": "√961",
                "answer": 31,
                "hint": "31² = 961"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{1024}",
                "unicode": "√1024",
                "answer": 32,
                "hint": "32² = 1024 (2⁵)² = 2¹⁰"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{1089}",
                "unicode": "√1089",
                "answer": 33,
                "hint": "33² = 1089"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{1156}",
                "unicode": "√1156",
                "answer": 34,
                "hint": "34² = 1156"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{1225}",
                "unicode": "√1225",
                "answer": 35,
                "hint": "35² = 1225"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{1296}",
                "unicode": "√1296",
                "answer": 36,
                "hint": "36² = 1296 (6⁴)"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{1444}",
                "unicode": "√1444",
                "answer": 38,
                "hint": "38² = 1444"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{1600}",
                "unicode": "√1600",
                "answer": 40,
                "hint": "40² = 1600"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{2500}",
                "unicode": "√2500",
                "answer": 50,
                "hint": "50² = 2500"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{3600}",
                "unicode": "√3600",
                "answer": 60,
                "hint": "60² = 3600"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{4900}",
                "unicode": "√4900",
                "answer": 70,
                "hint": "70² = 4900"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{6400}",
                "unicode": "√6400",
                "answer": 80,
                "hint": "80² = 6400"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{8100}",
                "unicode": "√8100",
                "answer": 90,
                "hint": "90² = 8100"
        },
        {
                "category": "roots_sq",
                "difficulty": "hard",
                "latex": "\\sqrt{10000}",
                "unicode": "√10000",
                "answer": 100,
                "hint": "100² = 10000"
        },
        {
                "category": "roots_cb",
                "difficulty": "easy",
                "latex": "\\sqrt[3]{0}",
                "unicode": "∛0",
                "answer": 0,
                "hint": "0³ = 0"
        },
        {
                "category": "roots_cb",
                "difficulty": "easy",
                "latex": "\\sqrt[3]{1}",
                "unicode": "∛1",
                "answer": 1,
                "hint": "1³ = 1"
        },
        {
                "category": "roots_cb",
                "difficulty": "easy",
                "latex": "\\sqrt[3]{8}",
                "unicode": "∛8",
                "answer": 2,
                "hint": "2³ = 8"
        },
        {
                "category": "roots_cb",
                "difficulty": "easy",
                "latex": "\\sqrt[3]{27}",
                "unicode": "∛27",
                "answer": 3,
                "hint": "3³ = 27"
        },
        {
                "category": "roots_cb",
                "difficulty": "easy",
                "latex": "\\sqrt[3]{64}",
                "unicode": "∛64",
                "answer": 4,
                "hint": "4³ = 64"
        },
        {
                "category": "roots_cb",
                "difficulty": "easy",
                "latex": "\\sqrt[3]{125}",
                "unicode": "∛125",
                "answer": 5,
                "hint": "5³ = 125"
        },
        {
                "category": "roots_cb",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{216}",
                "unicode": "∛216",
                "answer": 6,
                "hint": "6³ = 216"
        },
        {
                "category": "roots_cb",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{343}",
                "unicode": "∛343",
                "answer": 7,
                "hint": "7³ = 343"
        },
        {
                "category": "roots_cb",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{512}",
                "unicode": "∛512",
                "answer": 8,
                "hint": "8³ = 512 (2⁹)"
        },
        {
                "category": "roots_cb",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{729}",
                "unicode": "∛729",
                "answer": 9,
                "hint": "9³ = 729 (3⁶)"
        },
        {
                "category": "roots_cb",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{1000}",
                "unicode": "∛1000",
                "answer": 10,
                "hint": "10³ = 1000"
        },
        {
                "category": "roots_cb",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{1331}",
                "unicode": "∛1331",
                "answer": 11,
                "hint": "11³ = 1331"
        },
        {
                "category": "roots_cb",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{1728}",
                "unicode": "∛1728",
                "answer": 12,
                "hint": "12³ = 1728"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-1}",
                "unicode": "∛(-1)",
                "answer": -1,
                "hint": "(-1)³ = -1"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-8}",
                "unicode": "∛(-8)",
                "answer": -2,
                "hint": "(-2)³ = -8"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-27}",
                "unicode": "∛(-27)",
                "answer": -3,
                "hint": "(-3)³ = -27"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-64}",
                "unicode": "∛(-64)",
                "answer": -4,
                "hint": "(-4)³ = -64"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-125}",
                "unicode": "∛(-125)",
                "answer": -5,
                "hint": "(-5)³ = -125"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-216}",
                "unicode": "∛(-216)",
                "answer": -6,
                "hint": "(-6)³ = -216"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-343}",
                "unicode": "∛(-343)",
                "answer": -7,
                "hint": "(-7)³ = -343"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-512}",
                "unicode": "∛(-512)",
                "answer": -8,
                "hint": "(-8)³ = -512"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-729}",
                "unicode": "∛(-729)",
                "answer": -9,
                "hint": "(-9)³ = -729"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-1000}",
                "unicode": "∛(-1000)",
                "answer": -10,
                "hint": "(-10)³ = -1000"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{2197}",
                "unicode": "∛2197",
                "answer": 13,
                "hint": "13³ = 2197"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{2744}",
                "unicode": "∛2744",
                "answer": 14,
                "hint": "14³ = 2744"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{3375}",
                "unicode": "∛3375",
                "answer": 15,
                "hint": "15³ = 3375"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{8000}",
                "unicode": "∛8000",
                "answer": 20,
                "hint": "20³ = 8000"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{27000}",
                "unicode": "∛27000",
                "answer": 30,
                "hint": "30³ = 27000"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{64000}",
                "unicode": "∛64000",
                "answer": 40,
                "hint": "40³ = 64000"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{125000}",
                "unicode": "∛125000",
                "answer": 50,
                "hint": "50³ = 125000"
        },
        {
                "category": "roots_cb",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{1000000}",
                "unicode": "∛1000000",
                "answer": 100,
                "hint": "100³ = 1000000"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "2^0",
                "unicode": "2⁰",
                "answer": 1,
                "hint": "Любое число в нулевой степени = 1"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "2^1",
                "unicode": "2¹",
                "answer": 2,
                "hint": "2¹ = 2"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "2^2",
                "unicode": "2²",
                "answer": 4,
                "hint": "2 × 2 = 4"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "2^3",
                "unicode": "2³",
                "answer": 8,
                "hint": "2 × 2 × 2 = 8"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "2^4",
                "unicode": "2⁴",
                "answer": 16,
                "hint": "2⁴ = 16"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "2^5",
                "unicode": "2⁵",
                "answer": 32,
                "hint": "2⁵ = 32"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "3^0",
                "unicode": "3⁰",
                "answer": 1,
                "hint": "3⁰ = 1"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "3^1",
                "unicode": "3¹",
                "answer": 3,
                "hint": "3¹ = 3"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "3^2",
                "unicode": "3²",
                "answer": 9,
                "hint": "3 × 3 = 9"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "3^3",
                "unicode": "3³",
                "answer": 27,
                "hint": "3 × 3 × 3 = 27"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "4^1",
                "unicode": "4¹",
                "answer": 4,
                "hint": "4¹ = 4"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "4^2",
                "unicode": "4²",
                "answer": 16,
                "hint": "4 × 4 = 16"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "5^1",
                "unicode": "5¹",
                "answer": 5,
                "hint": "5¹ = 5"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "5^2",
                "unicode": "5²",
                "answer": 25,
                "hint": "5 × 5 = 25"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "6^2",
                "unicode": "6²",
                "answer": 36,
                "hint": "6 × 6 = 36"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "7^2",
                "unicode": "7²",
                "answer": 49,
                "hint": "7 × 7 = 49"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "8^2",
                "unicode": "8²",
                "answer": 64,
                "hint": "8 × 8 = 64"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "9^2",
                "unicode": "9²",
                "answer": 81,
                "hint": "9 × 9 = 81"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "10^2",
                "unicode": "10²",
                "answer": 100,
                "hint": "10 × 10 = 100"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "11^2",
                "unicode": "11²",
                "answer": 121,
                "hint": "11 × 11 = 121"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "12^2",
                "unicode": "12²",
                "answer": 144,
                "hint": "12 × 12 = 144"
        },
        {
                "category": "powers",
                "difficulty": "easy",
                "latex": "99^0",
                "unicode": "99⁰",
                "answer": 1,
                "hint": "Любое ненулевое число в степени 0 = 1"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "2^6",
                "unicode": "2⁶",
                "answer": 64,
                "hint": "2⁶ = 64"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "2^7",
                "unicode": "2⁷",
                "answer": 128,
                "hint": "2⁷ = 128"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "2^8",
                "unicode": "2⁸",
                "answer": 256,
                "hint": "2⁸ = 256"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "3^4",
                "unicode": "3⁴",
                "answer": 81,
                "hint": "3⁴ = 81"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "3^5",
                "unicode": "3⁵",
                "answer": 243,
                "hint": "3⁵ = 243"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "4^3",
                "unicode": "4³",
                "answer": 64,
                "hint": "4³ = 64"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "4^4",
                "unicode": "4⁴",
                "answer": 256,
                "hint": "4⁴ = 256"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "5^3",
                "unicode": "5³",
                "answer": 125,
                "hint": "5³ = 125"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "5^4",
                "unicode": "5⁴",
                "answer": 625,
                "hint": "5⁴ = 625"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "6^3",
                "unicode": "6³",
                "answer": 216,
                "hint": "6³ = 216"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "7^3",
                "unicode": "7³",
                "answer": 343,
                "hint": "7³ = 343"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "8^3",
                "unicode": "8³",
                "answer": 512,
                "hint": "8³ = 512"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "9^3",
                "unicode": "9³",
                "answer": 729,
                "hint": "9³ = 729"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "10^3",
                "unicode": "10³",
                "answer": 1000,
                "hint": "10³ = 1000"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "13^2",
                "unicode": "13²",
                "answer": 169,
                "hint": "13 × 13 = 169"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "14^2",
                "unicode": "14²",
                "answer": 196,
                "hint": "14 × 14 = 196"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "15^2",
                "unicode": "15²",
                "answer": 225,
                "hint": "15 × 15 = 225"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "16^2",
                "unicode": "16²",
                "answer": 256,
                "hint": "16 × 16 = 256"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "20^2",
                "unicode": "20²",
                "answer": 400,
                "hint": "20 × 20 = 400"
        },
        {
                "category": "powers",
                "difficulty": "normal",
                "latex": "25^2",
                "unicode": "25²",
                "answer": 625,
                "hint": "25 × 25 = 625"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "2^9",
                "unicode": "2⁹",
                "answer": 512,
                "hint": "2⁹ = 512"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "2^{10}",
                "unicode": "2¹⁰",
                "answer": 1024,
                "hint": "2¹⁰ = 1024"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "3^6",
                "unicode": "3⁶",
                "answer": 729,
                "hint": "3⁶ = 729"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "4^5",
                "unicode": "4⁵",
                "answer": 1024,
                "hint": "4⁵ = 1024 (2¹⁰)"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "(-2)^3",
                "unicode": "(-2)³",
                "answer": -8,
                "hint": "(-2) × (-2) × (-2) = -8"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "(-2)^4",
                "unicode": "(-2)⁴",
                "answer": 16,
                "hint": "(-2)⁴ = 16 (чётная степень положительна)"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "(-2)^5",
                "unicode": "(-2)⁵",
                "answer": -32,
                "hint": "(-2)⁵ = -32"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "(-3)^3",
                "unicode": "(-3)³",
                "answer": -27,
                "hint": "(-3)³ = -27"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "(-3)^4",
                "unicode": "(-3)⁴",
                "answer": 81,
                "hint": "(-3)⁴ = 81"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "(-5)^3",
                "unicode": "(-5)³",
                "answer": -125,
                "hint": "(-5)³ = -125"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "(-1)^{99}",
                "unicode": "(-1)⁹⁹",
                "answer": -1,
                "hint": "Нечётная степень (-1) = -1"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "(-1)^{100}",
                "unicode": "(-1)¹⁰⁰",
                "answer": 1,
                "hint": "Чётная степень (-1) = 1"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "10^4",
                "unicode": "10⁴",
                "answer": 10000,
                "hint": "10⁴ = 10000"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "30^2",
                "unicode": "30²",
                "answer": 900,
                "hint": "30 × 30 = 900"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "50^2",
                "unicode": "50²",
                "answer": 2500,
                "hint": "50 × 50 = 2500"
        },
        {
                "category": "powers",
                "difficulty": "hard",
                "latex": "100^2",
                "unicode": "100²",
                "answer": 10000,
                "hint": "100 × 100 = 10000"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{81} - 4",
                "unicode": "√81 - 4",
                "answer": 5,
                "hint": "9 - 4 = 5"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{25} + 7",
                "unicode": "√25 + 7",
                "answer": 12,
                "hint": "5 + 7 = 12"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{49} + 3",
                "unicode": "√49 + 3",
                "answer": 10,
                "hint": "7 + 3 = 10"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{100} - 6",
                "unicode": "√100 - 6",
                "answer": 4,
                "hint": "10 - 6 = 4"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{36} + \\sqrt{9}",
                "unicode": "√36 + √9",
                "answer": 9,
                "hint": "6 + 3 = 9"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{64} - \\sqrt{16}",
                "unicode": "√64 - √16",
                "answer": 4,
                "hint": "8 - 4 = 4"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "2^3 + \\sqrt{25}",
                "unicode": "2³ + √25",
                "answer": 13,
                "hint": "8 + 5 = 13"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "3^2 - \\sqrt{16}",
                "unicode": "3² - √16",
                "answer": 5,
                "hint": "9 - 4 = 5"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{121} - \\sqrt{81}",
                "unicode": "√121 - √81",
                "answer": 2,
                "hint": "11 - 9 = 2"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{16} \\times 3",
                "unicode": "√16 × 3",
                "answer": 12,
                "hint": "4 × 3 = 12"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{100} \\div 2",
                "unicode": "√100 ÷ 2",
                "answer": 5,
                "hint": "10 ÷ 2 = 5"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "5^2 - 20",
                "unicode": "5² - 20",
                "answer": 5,
                "hint": "25 - 20 = 5"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{1} + \\sqrt{4} + \\sqrt{9}",
                "unicode": "√1 + √4 + √9",
                "answer": 6,
                "hint": "1 + 2 + 3 = 6"
        },
        {
                "category": "expressions",
                "difficulty": "easy",
                "latex": "\\sqrt{64} \\div \\sqrt{4}",
                "unicode": "√64 ÷ √4",
                "answer": 4,
                "hint": "8 ÷ 2 = 4"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{81} + \\sqrt{49}",
                "unicode": "√81 + √49",
                "answer": 16,
                "hint": "9 + 7 = 16"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{144} - \\sqrt{64}",
                "unicode": "√144 - √64",
                "answer": 4,
                "hint": "12 - 8 = 4"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{64} \\times 2",
                "unicode": "√64 × 2",
                "answer": 16,
                "hint": "8 × 2 = 16"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{100} + \\sqrt{25}",
                "unicode": "√100 + √25",
                "answer": 15,
                "hint": "10 + 5 = 15"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{36} \\cdot \\sqrt{4}",
                "unicode": "√36 × √4",
                "answer": 12,
                "hint": "6 × 2 = 12"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{27} + \\sqrt{49}",
                "unicode": "∛27 + √49",
                "answer": 10,
                "hint": "3 + 7 = 10"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{64} \\times \\sqrt{25}",
                "unicode": "∛64 × √25",
                "answer": 20,
                "hint": "4 × 5 = 20"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "2^5 - \\sqrt{144}",
                "unicode": "2⁵ - √144",
                "answer": 20,
                "hint": "32 - 12 = 20"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "3^3 - \\sqrt{64}",
                "unicode": "3³ - √64",
                "answer": 19,
                "hint": "27 - 8 = 19"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\frac{\\sqrt{144}}{3}",
                "unicode": "√144 ÷ 3",
                "answer": 4,
                "hint": "12 ÷ 3 = 4"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\frac{\\sqrt{196}}{2}",
                "unicode": "√196 ÷ 2",
                "answer": 7,
                "hint": "14 ÷ 2 = 7"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{225} + \\sqrt{100}",
                "unicode": "√225 + √100",
                "answer": 25,
                "hint": "15 + 10 = 25"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{256} - \\sqrt{81}",
                "unicode": "√256 - √81",
                "answer": 7,
                "hint": "16 - 9 = 7"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt[3]{125} + 3^2",
                "unicode": "∛125 + 3²",
                "answer": 14,
                "hint": "5 + 9 = 14"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{400} \\div \\sqrt{25}",
                "unicode": "√400 ÷ √25",
                "answer": 4,
                "hint": "20 ÷ 5 = 4"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "2^4 + 3^2",
                "unicode": "2⁴ + 3²",
                "answer": 25,
                "hint": "16 + 9 = 25"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{3^2 + 4^2}",
                "unicode": "√(3² + 4²)",
                "answer": 5,
                "hint": "√(9 + 16) = √25 = 5 (Египетский треугольник)"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{6^2 + 8^2}",
                "unicode": "√(6² + 8²)",
                "answer": 10,
                "hint": "√(36 + 64) = √100 = 10"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{10^2 - 8^2}",
                "unicode": "√(10² - 8²)",
                "answer": 6,
                "hint": "√(100 - 64) = √36 = 6"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{13^2 - 12^2}",
                "unicode": "√(13² - 12²)",
                "answer": 5,
                "hint": "√(169 - 144) = √25 = 5"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{100} - 3^2",
                "unicode": "√100 - 3²",
                "answer": 1,
                "hint": "10 - 9 = 1"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{81} - 2^3",
                "unicode": "√81 - 2³",
                "answer": 1,
                "hint": "9 - 8 = 1"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "5^2 - 4^2",
                "unicode": "5² - 4²",
                "answer": 9,
                "hint": "25 - 16 = 9 (3²)"
        },
        {
                "category": "expressions",
                "difficulty": "normal",
                "latex": "\\sqrt{144} + \\sqrt{25} - \\sqrt{81}",
                "unicode": "√144 + √25 - √81",
                "answer": 8,
                "hint": "12 + 5 - 9 = 8"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{225} - 15",
                "unicode": "√225 - 15",
                "answer": 0,
                "hint": "15 - 15 = 0"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{216} + 4",
                "unicode": "∛216 + 4",
                "answer": 10,
                "hint": "6 + 4 = 10"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{196} - \\sqrt{49}",
                "unicode": "√196 - √49",
                "answer": 7,
                "hint": "14 - 7 = 7"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\frac{\\sqrt{144} + \\sqrt{64}}{4}",
                "unicode": "(√144 + √64) ÷ 4",
                "answer": 5,
                "hint": "(12 + 8) ÷ 4 = 5"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\frac{\\sqrt{400} - \\sqrt{100}}{2}",
                "unicode": "(√400 - √100) ÷ 2",
                "answer": 5,
                "hint": "(20 - 10) ÷ 2 = 5"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{1000} \\times \\sqrt{9} - 15",
                "unicode": "∛1000 × √9 - 15",
                "answer": 15,
                "hint": "10 × 3 - 15 = 15"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\frac{\\sqrt{625} + \\sqrt{225}}{8}",
                "unicode": "(√625 + √225) ÷ 8",
                "answer": 5,
                "hint": "(25 + 15) ÷ 8 = 40 ÷ 8 = 5"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{5^2 + 12^2}",
                "unicode": "√(5² + 12²)",
                "answer": 13,
                "hint": "√(25 + 144) = √169 = 13 (Тройка Пифагора)"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{8^2 + 15^2}",
                "unicode": "√(8² + 15²)",
                "answer": 17,
                "hint": "√(64 + 225) = √289 = 17"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{7^2 + 24^2}",
                "unicode": "√(7² + 24²)",
                "answer": 25,
                "hint": "√(49 + 576) = √625 = 25"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{17^2 - 15^2}",
                "unicode": "√(17² - 15²)",
                "answer": 8,
                "hint": "√(289 - 225) = √64 = 8"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{25^2 - 24^2}",
                "unicode": "√(25² - 24²)",
                "answer": 7,
                "hint": "√(625 - 576) = √49 = 7"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{25^2 - 20^2}",
                "unicode": "√(25² - 20²)",
                "answer": 15,
                "hint": "√(625 - 400) = √225 = 15"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{512} + \\sqrt{289}",
                "unicode": "∛512 + √289",
                "answer": 25,
                "hint": "8 + 17 = 25"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{324} - \\sqrt[3]{343}",
                "unicode": "√324 - ∛343",
                "answer": 11,
                "hint": "18 - 7 = 11"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\frac{2^6 - 4}{6}",
                "unicode": "(2⁶ - 4) ÷ 6",
                "answer": 10,
                "hint": "(64 - 4) ÷ 6 = 10"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{1728} - \\sqrt[3]{216}",
                "unicode": "∛1728 - ∛216",
                "answer": 6,
                "hint": "12 - 6 = 6"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{2^{10}} - 2^4",
                "unicode": "√(2¹⁰) - 2⁴",
                "answer": 16,
                "hint": "32 - 16 = 16"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{3^4} + \\sqrt{2^6}",
                "unicode": "√(3⁴) + √(2⁶)",
                "answer": 17,
                "hint": "9 + 8 = 17"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "(\\sqrt{81} - \\sqrt{49})^4",
                "unicode": "(√81 - √49)⁴",
                "answer": 16,
                "hint": "(9 - 7)⁴ = 2⁴ = 16"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "(\\sqrt{100} - \\sqrt{64})^4",
                "unicode": "(√100 - √64)⁴",
                "answer": 16,
                "hint": "(10 - 8)⁴ = 2⁴ = 16"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\frac{\\sqrt{900} + \\sqrt{100}}{\\sqrt{16}}",
                "unicode": "(√900 + √100) ÷ √16",
                "answer": 10,
                "hint": "(30 + 10) ÷ 4 = 10"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-27} + \\sqrt{49}",
                "unicode": "∛(-27) + √49",
                "answer": 4,
                "hint": "-3 + 7 = 4"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-64} + \\sqrt{100}",
                "unicode": "∛(-64) + √100",
                "answer": 6,
                "hint": "-4 + 10 = 6"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-125} + \\sqrt{144}",
                "unicode": "∛(-125) + √144",
                "answer": 7,
                "hint": "-5 + 12 = 7"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt[3]{-216} + \\sqrt{196}",
                "unicode": "∛(-216) + √196",
                "answer": 8,
                "hint": "-6 + 14 = 8"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{576} \\div \\sqrt{36}",
                "unicode": "√576 ÷ √36",
                "answer": 4,
                "hint": "24 ÷ 6 = 4"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{484} - \\sqrt{121}",
                "unicode": "√484 - √121",
                "answer": 11,
                "hint": "22 - 11 = 11"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{625} - \\sqrt{256}",
                "unicode": "√625 - √256",
                "answer": 9,
                "hint": "25 - 16 = 9"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{400} - \\sqrt{289}",
                "unicode": "√400 - √289",
                "answer": 3,
                "hint": "20 - 17 = 3"
        },
        {
                "category": "expressions",
                "difficulty": "hard",
                "latex": "\\sqrt{1296} \\div 6",
                "unicode": "√1296 ÷ 6",
                "answer": 6,
                "hint": "36 ÷ 6 = 6"
        }
];
    }
}

window.questionManager = new QuestionManager();
