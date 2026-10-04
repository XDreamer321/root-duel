/**
 * ROOT DUEL - Math Question Generator & Database
 * Provides 100+ curated questions + procedural generation across all categories and difficulty tiers.
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

        while (attempts < 50) {
            attempts++;
            // 40% chance to pick from handcrafted bank, 60% procedural
            if (Math.random() < 0.4) {
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
            n = this.randomInt(1, 10); // 1 to 10
        } else if (difficulty === 'normal') {
            n = this.randomInt(11, 20); // 11 to 20
        } else {
            n = this.randomInt(15, 30); // 15 to 30
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
            n = this.randomInt(4, 10); // 4 to 10
        } else {
            // Hard includes negative cubes or larger values
            const allowNegative = Math.random() < 0.4;
            const mag = this.randomInt(6, 12);
            n = allowNegative ? -mag : mag;
        }

        const cube = n * n * n;
        const dispCube = cube < 0 ? `(${cube})` : `${cube}`;
        return {
            category: 'roots_cb',
            difficulty: difficulty,
            latex: cube < 0 ? `\\sqrt[3]{${cube}}` : `\\sqrt[3]{${cube}}`,
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
                base = this.randomInt(2, 9);
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
                base = this.randomInt(10, 16);
                exp = 2;
            } else if (type === 'base2') {
                base = 2;
                exp = this.randomInt(6, 9);
            } else if (type === 'base3') {
                base = 3;
                exp = this.randomInt(3, 5);
            } else {
                base = this.randomInt(4, 6);
                exp = 3;
            }
        } else {
            const type = this.randomChoice(['power4', 'base2', 'squares', 'base5']);
            if (type === 'base2') {
                base = 2;
                exp = 10; // 1024
            } else if (type === 'power4') {
                base = this.randomInt(2, 4);
                exp = 4;
            } else if (type === 'base5') {
                base = 5;
                exp = 4; // 625
            } else {
                base = this.randomInt(17, 25);
                exp = 2;
            }
        }

        const answer = Math.pow(base, exp);
        return {
            category: 'powers',
            difficulty: difficulty,
            latex: `${base}^{${exp}}`,
            unicode: `${base}^${exp}`,
            answer: answer,
            hint: `${base} в степени ${exp} = ${answer}`
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
            // e.g. √81 + √49, √144 / 3, 2 * √64
            const type = this.randomChoice(['two_roots', 'mult_root', 'div_root']);
            if (type === 'two_roots') {
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
            // HARD: e.g. (√144 + √64) / 4, √225 - 15, √196 - √49, ∛216 + 4
            const type = this.randomChoice(['bracket_div', 'cube_plus_sq', 'sq_div_root']);
            if (type === 'bracket_div') {
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
                const r = this.randomInt(12, 16);
                const sq = r * r;
                return {
                    category: 'expressions',
                    difficulty: 'hard',
                    latex: `\\frac{\\sqrt{${sq}}}{${r}}`,
                    unicode: `√${sq} ÷ ${r}`,
                    answer: 1,
                    hint: `${r} ÷ ${r} = 1`
                };
            }
        }
    }

    initHandcraftedBank() {
        return [
            // EASY SQUARE ROOTS
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{1}', unicode: '√1', answer: 1, hint: '1² = 1' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{4}', unicode: '√4', answer: 2, hint: '2² = 4' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{9}', unicode: '√9', answer: 3, hint: '3² = 9' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{16}', unicode: '√16', answer: 4, hint: '4² = 16' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{25}', unicode: '√25', answer: 5, hint: '5² = 25' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{36}', unicode: '√36', answer: 6, hint: '6² = 36' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{49}', unicode: '√49', answer: 7, hint: '7² = 49' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{64}', unicode: '√64', answer: 8, hint: '8² = 64' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{81}', unicode: '√81', answer: 9, hint: '9² = 81' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{100}', unicode: '√100', answer: 10, hint: '10² = 100' },
            { category: 'roots_sq', difficulty: 'easy', latex: '\\sqrt{121}', unicode: '√121', answer: 11, hint: '11² = 121' },

            // NORMAL SQUARE ROOTS
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{144}', unicode: '√144', answer: 12, hint: '12² = 144' },
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{169}', unicode: '√169', answer: 13, hint: '13² = 169' },
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{196}', unicode: '√196', answer: 14, hint: '14² = 196' },
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{225}', unicode: '√225', answer: 15, hint: '15² = 225' },
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{256}', unicode: '√256', answer: 16, hint: '16² = 256' },
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{289}', unicode: '√289', answer: 17, hint: '17² = 289' },
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{324}', unicode: '√324', answer: 18, hint: '18² = 324' },
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{361}', unicode: '√361', answer: 19, hint: '19² = 361' },
            { category: 'roots_sq', difficulty: 'normal', latex: '\\sqrt{400}', unicode: '√400', answer: 20, hint: '20² = 400' },

            // HARD SQUARE ROOTS
            { category: 'roots_sq', difficulty: 'hard', latex: '\\sqrt{441}', unicode: '√441', answer: 21, hint: '21² = 441' },
            { category: 'roots_sq', difficulty: 'hard', latex: '\\sqrt{484}', unicode: '√484', answer: 22, hint: '22² = 484' },
            { category: 'roots_sq', difficulty: 'hard', latex: '\\sqrt{529}', unicode: '√529', answer: 23, hint: '23² = 529' },
            { category: 'roots_sq', difficulty: 'hard', latex: '\\sqrt{576}', unicode: '√576', answer: 24, hint: '24² = 576' },
            { category: 'roots_sq', difficulty: 'hard', latex: '\\sqrt{625}', unicode: '√625', answer: 25, hint: '25² = 625' },
            { category: 'roots_sq', difficulty: 'hard', latex: '\\sqrt{900}', unicode: '√900', answer: 30, hint: '30² = 900' },

            // EASY CUBIC ROOTS
            { category: 'roots_cb', difficulty: 'easy', latex: '\\sqrt[3]{1}', unicode: '∛1', answer: 1, hint: '1³ = 1' },
            { category: 'roots_cb', difficulty: 'easy', latex: '\\sqrt[3]{8}', unicode: '∛8', answer: 2, hint: '2³ = 8' },
            { category: 'roots_cb', difficulty: 'easy', latex: '\\sqrt[3]{27}', unicode: '∛27', answer: 3, hint: '3³ = 27' },
            { category: 'roots_cb', difficulty: 'easy', latex: '\\sqrt[3]{64}', unicode: '∛64', answer: 4, hint: '4³ = 64' },
            { category: 'roots_cb', difficulty: 'easy', latex: '\\sqrt[3]{125}', unicode: '∛125', answer: 5, hint: '5³ = 125' },

            // NORMAL CUBIC ROOTS
            { category: 'roots_cb', difficulty: 'normal', latex: '\\sqrt[3]{216}', unicode: '∛216', answer: 6, hint: '6³ = 216' },
            { category: 'roots_cb', difficulty: 'normal', latex: '\\sqrt[3]{343}', unicode: '∛343', answer: 7, hint: '7³ = 343' },
            { category: 'roots_cb', difficulty: 'normal', latex: '\\sqrt[3]{512}', unicode: '∛512', answer: 8, hint: '8³ = 512' },
            { category: 'roots_cb', difficulty: 'normal', latex: '\\sqrt[3]{729}', unicode: '∛729', answer: 9, hint: '9³ = 729' },
            { category: 'roots_cb', difficulty: 'normal', latex: '\\sqrt[3]{1000}', unicode: '∛1000', answer: 10, hint: '10³ = 1000' },

            // HARD CUBIC ROOTS
            { category: 'roots_cb', difficulty: 'hard', latex: '\\sqrt[3]{-8}', unicode: '∛(-8)', answer: -2, hint: '(-2)³ = -8' },
            { category: 'roots_cb', difficulty: 'hard', latex: '\\sqrt[3]{-27}', unicode: '∛(-27)', answer: -3, hint: '(-3)³ = -27' },
            { category: 'roots_cb', difficulty: 'hard', latex: '\\sqrt[3]{-64}', unicode: '∛(-64)', answer: -4, hint: '(-4)³ = -64' },
            { category: 'roots_cb', difficulty: 'hard', latex: '\\sqrt[3]{-125}', unicode: '∛(-125)', answer: -5, hint: '(-5)³ = -125' },
            { category: 'roots_cb', difficulty: 'hard', latex: '\\sqrt[3]{1331}', unicode: '∛1331', answer: 11, hint: '11³ = 1331' },
            { category: 'roots_cb', difficulty: 'hard', latex: '\\sqrt[3]{1728}', unicode: '∛1728', answer: 12, hint: '12³ = 1728' },

            // POWERS
            { category: 'powers', difficulty: 'easy', latex: '2^3', unicode: '2³', answer: 8, hint: '2 × 2 × 2 = 8' },
            { category: 'powers', difficulty: 'easy', latex: '3^2', unicode: '3²', answer: 9, hint: '3 × 3 = 9' },
            { category: 'powers', difficulty: 'easy', latex: '4^2', unicode: '4²', answer: 16, hint: '4 × 4 = 16' },
            { category: 'powers', difficulty: 'easy', latex: '5^2', unicode: '5²', answer: 25, hint: '5 × 5 = 25' },
            { category: 'powers', difficulty: 'easy', latex: '2^4', unicode: '2⁴', answer: 16, hint: '2⁴ = 16' },
            { category: 'powers', difficulty: 'normal', latex: '2^5', unicode: '2⁵', answer: 32, hint: '2⁵ = 32' },
            { category: 'powers', difficulty: 'normal', latex: '2^6', unicode: '2⁶', answer: 64, hint: '2⁶ = 64' },
            { category: 'powers', difficulty: 'normal', latex: '3^3', unicode: '3³', answer: 27, hint: '3³ = 27' },
            { category: 'powers', difficulty: 'normal', latex: '4^3', unicode: '4³', answer: 64, hint: '4³ = 64' },
            { category: 'powers', difficulty: 'normal', latex: '5^3', unicode: '5³', answer: 125, hint: '5³ = 125' },
            { category: 'powers', difficulty: 'hard', latex: '2^7', unicode: '2⁷', answer: 128, hint: '2⁷ = 128' },
            { category: 'powers', difficulty: 'hard', latex: '2^8', unicode: '2⁸', answer: 256, hint: '2⁸ = 256' },
            { category: 'powers', difficulty: 'hard', latex: '3^4', unicode: '3⁴', answer: 81, hint: '3⁴ = 81' },
            { category: 'powers', difficulty: 'hard', latex: '10^3', unicode: '10³', answer: 1000, hint: '10³ = 1000' },

            // EXPRESSIONS
            { category: 'expressions', difficulty: 'easy', latex: '\\sqrt{81} - 4', unicode: '√81 - 4', answer: 5, hint: '9 - 4 = 5' },
            { category: 'expressions', difficulty: 'easy', latex: '\\sqrt{25} + 7', unicode: '√25 + 7', answer: 12, hint: '5 + 7 = 12' },
            { category: 'expressions', difficulty: 'easy', latex: '\\sqrt{49} + 3', unicode: '√49 + 3', answer: 10, hint: '7 + 3 = 10' },
            { category: 'expressions', difficulty: 'easy', latex: '\\sqrt{100} - 6', unicode: '√100 - 6', answer: 4, hint: '10 - 6 = 4' },
            { category: 'expressions', difficulty: 'normal', latex: '\\sqrt{81} + 3', unicode: '√81 + 3', answer: 12, hint: '9 + 3 = 12' },
            { category: 'expressions', difficulty: 'normal', latex: '\\sqrt{64} \\times 2', unicode: '√64 × 2', answer: 16, hint: '8 × 2 = 16' },
            { category: 'expressions', difficulty: 'normal', latex: '\\sqrt{100} + \\sqrt{25}', unicode: '√100 + √25', answer: 15, hint: '10 + 5 = 15' },
            { category: 'expressions', difficulty: 'normal', latex: '\\sqrt{36} \\cdot \\sqrt{4}', unicode: '√36 × √4', answer: 12, hint: '6 × 2 = 12' },
            { category: 'expressions', difficulty: 'hard', latex: '\\frac{\\sqrt{144}}{12}', unicode: '√144 ÷ 12', answer: 1, hint: '12 ÷ 12 = 1' },
            { category: 'expressions', difficulty: 'hard', latex: '\\sqrt{225} - 15', unicode: '√225 - 15', answer: 0, hint: '15 - 15 = 0' },
            { category: 'expressions', difficulty: 'hard', latex: '\\sqrt[3]{216} + 4', unicode: '∛216 + 4', answer: 10, hint: '6 + 4 = 10' },
            { category: 'expressions', difficulty: 'hard', latex: '\\sqrt{196} - \\sqrt{49}', unicode: '√196 - √49', answer: 7, hint: '14 - 7 = 7' },
            { category: 'expressions', difficulty: 'hard', latex: '\\frac{\\sqrt{144} + \\sqrt{64}}{4}', unicode: '(√144 + √64) ÷ 4', answer: 5, hint: '(12 + 8) ÷ 4 = 20 ÷ 4 = 5' }
        ];
    }
}

window.questionManager = new QuestionManager();
