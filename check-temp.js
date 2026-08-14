const moneyBasics = {
  course: {
    slug: 'money-basics',

    title: 'Money Basics',

    category: 'Foundations',

    description:
      'Build a strong foundation in personal finance by understanding money, income, expenses, cash flow, spending, saving, financial goals, and the habits that influence everyday financial decisions.',

    longDescription:
      'Money Basics is a complete beginner-friendly introduction to personal finance. The course is designed to help students understand how money works in everyday life and develop the foundational knowledge needed to make better financial decisions. Rather than focusing only on earning more money, the course explores the complete journey of money: where it comes from, how it is spent, how it moves through a person’s financial life, how financial decisions are made, and how money can be intentionally directed toward future goals. Students will learn how to distinguish income from expenses, understand positive and negative cash flow, identify needs and wants, recognize spending patterns, create realistic financial goals, understand saving, build an emergency fund, and develop a personal financial system. Through explanations, examples, practical activities, formulas, reflection exercises, and quizzes, students will gradually develop the financial vocabulary and decision-making skills needed to progress into more advanced subjects such as budgeting, investing, debt management, wealth building, entrepreneurship, and financial independence.',

    difficulty: 'Beginner',

    estimatedDuration: 240,

    prerequisites: [
      'No previous financial education is required.',
      'Basic arithmetic such as addition, subtraction, multiplication, and division is helpful.',
      'Students should be willing to examine their own financial habits and decisions.',
      'A basic understanding of everyday transactions such as earning, spending, saving, and receiving payments is useful.'
    ],

    targetAudience: [
      'Teenagers and students learning personal finance for the first time.',
      'Young adults who want to build strong financial foundations.',
      'Beginners who want to understand how personal finance works.',
      'People who earn money but struggle to understand where it goes.',
      'Anyone preparing to learn budgeting, saving, investing, or wealth building.',
      'Entrepreneurs and future entrepreneurs who want stronger personal financial foundations.'
    ],

    learningObjectives: [
      'Explain what money is and understand its major functions.',
      'Identify different forms and sources of income.',
      'Distinguish between fixed, variable, essential, and discretionary expenses.',
      'Calculate and interpret net cash flow.',
      'Understand the difference between needs and wants.',
      'Recognize common spending triggers and financial behavior patterns.',
      'Understand why increasing income alone does not guarantee financial stability.',
      'Create meaningful short-term, medium-term, and long-term financial goals.',
      'Understand the purpose of saving and emergency funds.',
      'Develop a simple personal financial system for managing money intentionally.',
      'Evaluate everyday financial decisions using opportunity cost and trade-offs.',
      'Explain how financial habits can influence long-term financial outcomes.'
    ],

    skillsGained: [
      'Financial vocabulary and foundational financial literacy.',
      'Income and expense classification.',
      'Basic cash-flow analysis.',
      'Needs-versus-wants analysis.',
      'Spending decision analysis.',
      'Basic financial goal setting.',
      'Saving strategy development.',
      'Emergency fund planning.',
      'Basic financial self-assessment.',
      'Personal money management.'
    ],

    outcomes: [
      'Students will be able to explain how money functions in an economy and in personal financial life.',
      'Students will be able to identify and classify their major sources of income and expenses.',
      'Students will be able to calculate their net cash flow.',
      'Students will understand why positive cash flow creates financial flexibility.',
      'Students will be able to analyze spending decisions instead of simply labeling expenses as good or bad.',
      'Students will be able to establish realistic financial goals.',
      'Students will understand how saving creates financial resilience.',
      'Students will be able to design a simple personal money-management routine.',
      'Students will have the foundation required for more advanced Miimiid courses.'
    ],

    order: 1,

    published: true
  },

  modules: [
    /*
     * =======================================================
     * MODULE 1
     * =======================================================
     */

    {
      slug: 'understanding-money',

      title: 'Module 1 — Understanding Money',

      description:
        'Build a clear mental model of money, its functions, its role in everyday life, and why financial literacy begins with understanding what money actually represents.',

      order: 1,

      lessons: [
        {
          slug: 'what-is-money',

          title: 'Lesson 1 — What Is Money?',

          estimatedDuration: 15,

          order: 1,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Money is one of the most important tools in modern economic life. We use it to buy goods and services, pay for transportation, receive income, operate businesses, save for future goals, and exchange value with other people. Yet many people use money every day without clearly understanding what money is or why it is useful. Financial literacy begins with understanding the role money plays in our lives.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'What Is Money?'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Money is a generally accepted tool used to exchange, measure, and preserve economic value. It allows people to participate in economic activity without having to rely entirely on direct barter. Money can take different physical or digital forms, but its usefulness comes from its ability to function within an economic system.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Three Traditional Functions of Money'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Money traditionally performs three major functions: medium of exchange, unit of account, and store of value. These functions explain why money makes economic activity easier and why understanding money is an important foundation of financial literacy.'
              }
            },

            {
              order: 6,
              type: 'heading',
              data: {
                level: 2,
                text: '1. Money as a Medium of Exchange'
              }
            },

            {
              order: 7,
              type: 'text',
              data: {
                text:
                  'A medium of exchange is something people generally accept in exchange for goods and services. Without money, people could have to rely on barter, where two people must find an exchange that both sides want. Imagine that a farmer has rice and wants a phone, while a phone seller wants shoes. The farmer would have difficulty buying the phone directly unless the seller wanted the rice or accepted something the farmer could provide. Money makes the process easier because the farmer can sell the rice for money and later use that money to purchase the phone. The phone seller does not need to want rice directly. Money separates the act of selling from the act of buying.'
              }
            },

            {
              order: 8,
              type: 'example',
              data: {
                title: 'Real-Life Example',
                text:
                  'Imagine you want to buy headphones costing $80. You do not need the store owner to want something you own. You provide $80, and the seller provides the headphones. Money makes the exchange possible without requiring a direct barter arrangement.'
              }
            },

            {
              order: 9,
              type: 'heading',
              data: {
                level: 2,
                text: '2. Money as a Unit of Account'
              }
            },

            {
              order: 10,
              type: 'text',
              data: {
                text:
                  'A unit of account provides a common way to measure and compare economic value. If one phone costs $200 and another costs $350, we can compare their prices because both are expressed in the same monetary unit. The same principle allows people to compare income, rent, food costs, transportation, education, products, services, and other expenses.'
              }
            },

            {
              order: 11,
              type: 'example',
              data: {
                title: 'Real-Life Example',
                text:
                  'Suppose a student is considering two courses. Course A costs $100 and Course B costs $250. Because both prices use the same monetary unit, the student can compare the financial cost and then consider whether the additional $150 is justified by the difference in value.'
              }
            },

            {
              order: 12,
              type: 'heading',
              data: {
                level: 2,
                text: '3. Money as a Store of Value'
              }
            },

            {
              order: 13,
              type: 'text',
              data: {
                text:
                  'Money can also serve as a store of value by allowing people to preserve purchasing power for future use. Someone may receive $1,000 today but decide not to spend all of it immediately. They can retain part of that money and use it later for an emergency, purchase, education, or another financial goal. However, money does not guarantee that exactly the same amount of goods and services can be purchased in the future because prices can change over time.'
              }
            },

            {
              order: 14,
              type: 'example',
              data: {
                title: 'Real-Life Example',
                text:
                  'Suppose $100 is enough to purchase a particular group of goods today. If those same goods later cost $120, your $100 has not disappeared, but its purchasing power has decreased because it now buys less than before.'
              }
            },

            {
              order: 15,
              type: 'heading',
              data: {
                level: 2,
                text: 'What Money Is Not'
              }
            },

            {
              order: 16,
              type: 'text',
              data: {
                text:
                  'Money is not the same thing as wealth. Wealth can include valuable assets, productive resources, investments, business interests, property, and other resources that contribute to a person’s overall financial position. Someone can have a high income and still build little wealth if they consistently spend everything they earn or accumulate significant obligations.'
              }
            },

            {
              order: 17,
              type: 'text',
              data: {
                text:
                  'Money is also not the same thing as income. Income describes money or economic value received, while money is the resource that can be spent, saved, allocated, or used for other purposes. For example, receiving a $3,000 salary represents income. What happens to that money afterward is a separate financial decision.'
              }
            },

            {
              order: 18,
              type: 'text',
              data: {
                text:
                  'Money does not guarantee investment profits. Having money available does not mean that every investment will produce a positive return. Investments can involve uncertainty and risk, so financial decisions should not be based on the assumption that profit is guaranteed.'
              }
            },

            {
              order: 19,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Purchasing Power',
                text:
                  'The numerical amount of money can remain unchanged while its purchasing power changes. If prices rise, the same amount of money may buy fewer goods and services. This is why financial literacy involves understanding not only how much money you have, but also what that money can accomplish.'
              }
            },

            {
              order: 20,
              type: 'heading',
              data: {
                level: 2,
                text: 'Why Understanding Money Matters'
              }
            },

            {
              order: 21,
              type: 'text',
              data: {
                text:
                  'Understanding money helps you think more clearly about how you earn, spend, save, protect, and allocate financial resources. The goal is not simply to accumulate money. The goal is to understand how money works so you can make more informed decisions about the resources available to you.'
              }
            },

            {
              order: 22,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Money functions as a medium of exchange.',
                  'Money provides a common unit for measuring and comparing economic value.',
                  'Money can serve as a store of value for future use.',
                  'Money is not the same thing as wealth or income.',
                  'Money does not guarantee investment profits.',
                  'The purchasing power of money can change over time.',
                  'Understanding money is a foundation of financial literacy.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which of the following is NOT a traditional function of money?',
              options: [
                'Medium of exchange',
                'Unit of account',
                'Store of value',
                'Guarantee of profit'
              ],
              correctAnswer: 3,
              explanation:
                'The traditional functions are medium of exchange, unit of account, and store of value. Money does not guarantee profit.',
              points: 10
            },

            {
              order: 2,
              questionType: 'multiple-choice',
              question:
                'Why is money useful as a unit of account?',
              options: [
                'It allows economic values to be expressed and compared using a common measure.',
                'It guarantees that prices will never change.',
                'It prevents people from spending money.',
                'It guarantees investment returns.'
              ],
              correctAnswer: 0,
              explanation:
                'A unit of account provides a common way to express and compare prices, income, expenses, and other economic values.',
              points: 10
            },

            {
              order: 3,
              questionType: 'true-false',
              question:
                'Understanding money is only about learning how to earn more money.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 1,
              explanation:
                'Financial literacy also includes spending, saving, protecting, allocating, and making decisions with money.',
              points: 10
            }
          ]
        },

        {
          slug: 'money-and-value',

          title: 'Lesson 2 — Money, Value and Purchasing Power',

          estimatedDuration: 12,

          order: 2,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Money is often treated as if it were the same thing as wealth or value. They are related, but they are not identical. Money is a tool used to measure and exchange economic value. Wealth refers more broadly to the resources and assets a person controls and the financial position those resources create.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Money Is a Tool'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Money becomes useful because it can be exchanged for goods, services, opportunities, and other resources. Having money provides options, but the quality of those options depends on how the money is used. Someone can receive a large income and still experience financial stress if their spending and obligations consume most of it.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Purchasing Power'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Purchasing power refers to how much goods and services a given amount of money can buy. If the price of something rises while your income remains unchanged, the same amount of money may buy less of it than before. This is one reason financial planning should consider not only how much money someone has but also what that money can actually accomplish.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Simple Example',
                text:
                  'Suppose ₦10,000 can purchase a particular basket of goods today. If those goods later cost ₦12,000, the same ₦10,000 no longer purchases the entire basket. The numerical amount has not changed, but its purchasing power has.'
              }
            },

            {
              order: 7,
              type: 'callout',
              data: {
                variant: 'warning',
                title: 'Think Beyond the Number',
                text:
                  'A financial decision should not be judged only by the amount of money involved. Consider what the money can accomplish, what opportunity is being given up, and how the decision affects future options.'
              }
            },

            {
              order: 8,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Money is a tool for exchanging and measuring value.',
                  'Money and wealth are related but not identical.',
                  'Purchasing power describes what money can actually buy.',
                  'Financial decisions should consider both present and future options.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'What does purchasing power describe?',
              options: [
                'How much money someone earns per month',
                'How much goods and services a given amount of money can buy',
                'How many bank accounts someone owns',
                'How much debt someone has'
              ],
              correctAnswer: 1,
              explanation:
                'Purchasing power refers to the quantity of goods and services that a given amount of money can purchase.',
              points: 10
            },

            {
              order: 2,
              questionType: 'true-false',
              question:
                'Having a large amount of money automatically means a person is financially wealthy.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 1,
              explanation:
                'Financial wealth depends on the broader relationship between resources, assets, obligations, income, spending, and long-term financial position.',
              points: 10
            }
          ]
        },

        {
          slug: 'financial-vocabulary',

          title: 'Lesson 3 — Essential Financial Vocabulary',

          estimatedDuration: 25,

          order: 3,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Financial vocabulary is not just a collection of definitions. These concepts describe what enters your financial life, what leaves it, what you own, what you owe, and how strong or fragile your financial position may be. Understanding these ideas gives you a framework for making better financial decisions.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Income — What Comes In'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Income is money or economic value received from a source such as employment, self-employment, business activity, investments, property, royalties, or other legitimate economic activity. Income is a major financial resource, but income alone does not determine financial strength. A person can earn a high income and still struggle financially when expenses, debt payments, taxes, and other obligations consume most of what is received.'
              }
            },

            {
              order: 4,
              type: 'example',
              data: {
                title: 'High Income Does Not Automatically Mean Wealth',
                text:
                  'Imagine two people who each receive $5,000 per month. One spends $4,800 on lifestyle expenses and debt payments. The other spends $3,000 and consistently saves and invests part of the difference. Their income is identical, but their financial positions can develop very differently.'
              }
            },

            {
              order: 5,
              type: 'heading',
              data: {
                level: 2,
                text: 'Expenses — What Goes Out'
              }
            },

            {
              order: 6,
              type: 'text',
              data: {
                text:
                  'An expense is money spent to obtain goods, services, experiences, or other benefits, or a cost that must be recognized as part of financial activity. Expenses can include housing, food, transportation, education, healthcare, communication, entertainment, subscriptions, and many other categories. Expenses are not automatically bad. The important questions are whether they are necessary or valuable, whether they are affordable, and whether they fit your priorities and available resources.'
              }
            },

            {
              order: 7,
              type: 'callout',
              data: {
                variant: 'warning',
                title: 'Lifestyle Can Consume Income',
                text:
                  'When income increases, increasing expenses at the same pace can prevent financial progress. Earning more money does not automatically create wealth if most of the additional income is immediately absorbed by a more expensive lifestyle.'
              }
            },

            {
              order: 8,
              type: 'heading',
              data: {
                level: 2,
                text: 'Assets — Resources With Economic Value'
              }
            },

            {
              order: 9,
              type: 'text',
              data: {
                text:
                  'An asset is a valuable economic resource that a person or organization owns or has a legitimate right to, and that can provide present or future financial benefit. An asset is not simply something you possess. It has economic value or the capacity to contribute value to your financial position.'
              }
            },

            {
              order: 10,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Depreciation Does Not Automatically Stop Something From Being an Asset',
                text:
                  'An asset can increase in value, maintain value, or decrease in value over time. Depreciation describes a decline in value; it does not automatically mean that the item is no longer an asset. A car can be an asset even though it normally depreciates.'
              }
            },

            {
              order: 11,
              type: 'example',
              data: {
                title: 'House, Car, and Investment Examples',
                text:
                  'A house can be an asset because it can have significant economic value. A car can also be an asset even though it may depreciate. Cash, savings, investments, and ownership in a business can also be assets. However, the asset itself must be considered alongside any debt or other obligation attached to it.'
              }
            },

            {
              order: 12,
              type: 'heading',
              data: {
                level: 2,
                text: 'Liabilities — Claims on Future Resources'
              }
            },

            {
              order: 13,
              type: 'text',
              data: {
                text:
                  'A liability is a financial obligation that requires future payment, settlement, or another form of economic sacrifice. Liabilities can include loans, credit-card balances, mortgages, unpaid bills, taxes owed, and other obligations. A liability matters because it represents a claim on future financial resources.'
              }
            },

            {
              order: 14,
              type: 'callout',
              data: {
                variant: 'warning',
                title: 'Do Not Look Only at What You Own',
                text:
                  'A person can appear wealthy because they own an expensive house, car, or business while owing large amounts of money. Looking only at assets can create a misleading picture. Financial position becomes clearer when assets and liabilities are considered together.'
              }
            },

            {
              order: 15,
              type: 'example',
              data: {
                title: 'House vs Mortgage',
                text:
                  'Suppose someone owns a house worth $300,000 but still owes $220,000 on the mortgage. The house is an asset. The mortgage is a liability. The person does not simply have $300,000 of financial wealth from the house because the $220,000 obligation must also be considered.'
              }
            },

            {
              order: 16,
              type: 'heading',
              data: {
                level: 2,
                text: 'Debt — Borrowing That Creates an Obligation'
              }
            },

            {
              order: 17,
              type: 'text',
              data: {
                text:
                  'Debt is money borrowed that creates an obligation to repay. Common examples include personal loans, mortgages, student loans, business loans, and credit-card balances. Debt can sometimes help someone acquire an asset, fund education, build a business, or handle a temporary financial need. But borrowing also commits future income to repayment and may create interest, fees, and other costs.'
              }
            },

            {
              order: 18,
              type: 'callout',
              data: {
                variant: 'warning',
                title: 'The Monthly Payment Is Not the Whole Story',
                text:
                  'A borrowing decision should not be judged only by whether the monthly payment looks affordable. Consider the amount borrowed, interest rate, fees, repayment period, total repayment cost, purpose of the debt, and what would happen if your income decreased.'
              }
            },

            {
              order: 19,
              type: 'example',
              data: {
                title: 'The Cost of Borrowing',
                text:
                  'Someone may receive $10,000 from a loan but repay considerably more than $10,000 after interest and fees. The important question is not only how much money enters your account today, but how much the borrowing will ultimately cost and whether the repayment will remain manageable.'
              }
            },

            {
              order: 20,
              type: 'heading',
              data: {
                level: 2,
                text: 'Why Excessive Liabilities Can Become Dangerous'
              }
            },

            {
              order: 21,
              type: 'text',
              data: {
                text:
                  'Liabilities can become dangerous when too much of a person’s future income is already committed to repayments and other obligations. When obligations consume most available income, there may be little room for saving, investing, emergencies, or unexpected changes in circumstances. This is one reason people can have impressive possessions while still being financially fragile.'
              }
            },

            {
              order: 22,
              type: 'callout',
              data: {
                variant: 'warning',
                title: 'Financial Freedom Requires Future Flexibility',
                text:
                  'The more of your future income that is already committed to debt and other obligations, the less flexibility you may have when life changes. Before taking on a liability, think beyond today’s purchase and consider the effect on your future choices.'
              }
            },

            {
              order: 23,
              type: 'heading',
              data: {
                level: 2,
                text: 'Net Worth — Assets Minus Liabilities'
              }
            },

            {
              order: 24,
              type: 'text',
              data: {
                text:
                  'Net worth provides a simplified picture of financial position by comparing what you own with what you owe. The basic formula is: Net Worth = Assets − Liabilities. This does not measure every part of financial health, but it helps explain why possessions, income, and wealth are not the same thing.'
              }
            },

            {
              order: 25,
              type: 'example',
              data: {
                title: 'Simple Net Worth Example',
                text:
                  'If someone has assets worth $80,000 and liabilities of $30,000, their simplified net worth is $50,000. If their liabilities increase substantially while their assets do not increase accordingly, their net worth can fall.'
              }
            },

            {
              order: 26,
              type: 'heading',
              data: {
                level: 2,
                text: 'Cash Flow — The Movement of Money'
              }
            },

            {
              order: 27,
              type: 'text',
              data: {
                text:
                  'Cash flow describes money moving into and out of a financial system over a period. A simple personal framework is: Net Cash Flow = Income − Expenses. Positive cash flow means more money came in than went out during the period. Negative cash flow means more money went out than came in.'
              }
            },

            {
              order: 28,
              type: 'heading',
              data: {
                level: 2,
                text: 'Budget — Giving Your Money a Job'
              }
            },

            {
              order: 29,
              type: 'text',
              data: {
                text:
                  'A budget is a plan for allocating available financial resources. It helps a person intentionally direct money toward necessities, discretionary spending, saving, debt repayment, investing, and other goals. A budget is not simply about restricting spending. It is about making financial choices visible and intentional.'
              }
            },

            {
              order: 30,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Put the Concepts Together',
                text:
                  'Income provides resources. Expenses consume resources. Cash flow shows what happens to money over time. Assets represent valuable economic resources. Liabilities represent obligations. Debt is a common form of liability. Net worth compares assets with liabilities. A budget helps organize how available resources are used.'
              }
            },

            {
              order: 31,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Income is money or economic value received.',
                  'Expenses are costs associated with spending or financial activity.',
                  'Assets are valuable economic resources that can provide present or future financial benefit.',
                  'An asset can depreciate and still remain an asset.',
                  'A house can be an asset while its mortgage is a liability.',
                  'Liabilities represent claims on future financial resources.',
                  'Debt is borrowed money that creates a repayment obligation.',
                  'High income does not automatically mean wealth.',
                  'Net worth can be simplified as Assets − Liabilities.',
                  'Net cash flow can be simplified as Income − Expenses.',
                  'A budget helps allocate available resources intentionally.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which statement best describes an asset?',
              options: [
                'A valuable economic resource that can provide present or future financial benefit',
                'Any item that a person happens to possess',
                'Money borrowed from another person',
                'A payment obligation'
              ],
              correctAnswer: 0,
              explanation:
                'An asset is a valuable economic resource that can contribute present or future financial benefit.',
              points: 10
            },

            {
              order: 2,
              questionType: 'multiple-choice',
              question:
                'Which statement about depreciation is correct?',
              options: [
                'Anything that depreciates automatically stops being an asset',
                'Depreciation describes a decline in value and does not automatically stop something from being an asset',
                'Only investments can depreciate',
                'A depreciating item is always a liability'
              ],
              correctAnswer: 1,
              explanation:
                'Depreciation describes a decline in value. An item can depreciate while still being an asset.',
              points: 10
            },

            {
              order: 3,
              questionType: 'multiple-choice',
              question:
                'Which statement best describes a liability?',
              options: [
                'A resource that always produces income',
                'A financial obligation requiring future payment or settlement',
                'Any valuable possession',
                'Money that has already been saved'
              ],
              correctAnswer: 1,
              explanation:
                'A liability represents an obligation that requires future payment, settlement, or another economic sacrifice.',
              points: 10
            },

            {
              order: 4,
              questionType: 'multiple-choice',
              question:
                'Someone owns a house worth $300,000 and owes $220,000 on the mortgage. Which statement is correct?',
              options: [
                'The house is a liability and the mortgage is an asset',
                'Both the house and mortgage are assets',
                'The house is an asset and the mortgage is a liability',
                'Neither has financial value'
              ],
              correctAnswer: 2,
              explanation:
                'The house is an asset because it has economic value. The mortgage is a liability because it creates an obligation to repay.',
              points: 10
            },

            {
              order: 5,
              questionType: 'multiple-choice',
              question:
                'Why can a person with a high income still experience financial difficulty?',
              options: [
                'Income is always harmful',
                'Expenses, debt payments, and other obligations may consume most of the income',
                'High income prevents saving',
                'Assets disappear when income increases'
              ],
              correctAnswer: 1,
              explanation:
                'High income does not guarantee financial strength when expenses and obligations consume most of the resources received.',
              points: 10
            },

            {
              order: 6,
              questionType: 'multiple-choice',
              question:
                'What should someone consider before taking on significant debt?',
              options: [
                'Only the amount received',
                'Only the monthly payment',
                'Total repayment cost, interest, fees, purpose, payment burden, and ability to handle changes in income',
                'Whether other people are borrowing'
              ],
              correctAnswer: 2,
              explanation:
                'Responsible borrowing requires looking beyond the amount received or monthly payment and considering the complete financial commitment.',
              points: 10
            },

            {
              order: 7,
              questionType: 'multiple-choice',
              question:
                'Which formula represents simplified net worth?',
              options: [
                'Income − Expenses',
                'Assets − Liabilities',
                'Expenses − Income',
                'Debt + Expenses'
              ],
              correctAnswer: 1,
              explanation:
                'Simplified net worth is calculated as Assets − Liabilities.',
              points: 10
            },

            {
              order: 8,
              questionType: 'true-false',
              question:
                'Owning an expensive asset automatically means a person is financially wealthy.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 1,
              explanation:
                'The complete picture also requires considering liabilities, expenses, cash flow, and other financial obligations.',
              points: 10
            }
          ]
        },

    /*
     * =======================================================
     * MODULE 2
     * =======================================================
     */

    {
      slug: 'income-and-earning',

      title: 'Module 2 — Income and Earning',

      description:
        'Understand where money comes from, the difference between active and passive sources of income, and why earning power is an important part of financial development.',

      order: 2,

      lessons: [
        {
          slug: 'understanding-income',

          title: 'Lesson 1 — Understanding Income',

          estimatedDuration: 12,

          order: 1,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Income is one of the major inputs into a personal financial system. It represents money or economic value received from work, business activity, investments, property, or other legitimate sources. Understanding income requires more than knowing the amount received. It also requires understanding where the money comes from, how reliable it is, when it arrives, and what obligations are attached to it.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Common Sources of Income'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Common sources include wages, salaries, freelance payments, commissions, business revenue, interest, dividends, rental income, royalties, and other legitimate economic activities. Different sources may have different levels of reliability, timing, risk, and effort requirements.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Gross and Net Income'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Gross income generally refers to income before certain deductions, while net income refers to the amount remaining after applicable deductions. When planning personal spending, the amount actually available to use is usually more relevant than the headline amount.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Example',
                text:
                  'Imagine a worker receives ₦300,000 in gross monthly earnings but only ₦270,000 becomes available after applicable deductions. A realistic spending plan should be built around the amount actually available rather than assuming the full ₦300,000 can be spent.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Income is a major input into personal cash flow.',
                  'Income can come from employment, business, investments, property, or other legitimate sources.',
                  'Different income sources have different levels of reliability.',
                  'Planning should account for the amount actually available to spend.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which of the following can be a source of income?',
              options: [
                'Salary',
                'Electricity bill',
                'Grocery expense',
                'Transportation expense'
              ],
              correctAnswer: 0,
              explanation:
                'Salary is money received in exchange for employment and is therefore a source of income.',
              points: 10
            },

            {
              order: 2,
              questionType: 'true-false',
              question:
                'When planning spending, it is important to consider the amount of income actually available for use.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 0,
              explanation:
                'A realistic financial plan should be based on money actually available after relevant deductions and obligations.',
              points: 10
            }
          ]
        },

        {
          slug: 'active-and-passive-income',

          title: 'Lesson 2 — Active and Passive Income',

          estimatedDuration: 12,

          order: 2,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Income sources can also be considered in terms of the relationship between effort and payment. Active income generally requires ongoing participation or work. Some income sources may continue generating economic returns after significant initial effort or capital has been provided, although the word passive should not be interpreted as meaning effortless or risk-free.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Active Income'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Examples of active income include wages, salaries, freelance work, consulting, commissions, and many forms of business activity. The person generally exchanges time, expertise, labor, or direct participation for income.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Income That Can Continue Beyond Direct Work'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Some assets or systems can produce income without requiring the same amount of direct labor for every unit of income. Examples may include certain investments, intellectual property, or rental arrangements. However, these sources can involve capital requirements, maintenance, taxes, uncertainty, and risk.'
              }
            },

            {
              order: 6,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Important',
                text:
                  'There is no universal source of easy money. Income sources can involve time, skill, capital, risk, or a combination of these.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Active income usually requires ongoing participation.',
                  'Some income-producing assets or systems can reduce the amount of direct labor required for each payment.',
                  'Income sources can involve risk and maintenance.',
                  'Building multiple income sources should be approached deliberately rather than through promises of effortless wealth.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which is generally an example of active income?',
              options: [
                'Salary from employment',
                'A theoretical future investment return',
                'An unpaid expense',
                'A grocery purchase'
              ],
              correctAnswer: 0,
              explanation:
                'A salary generally requires ongoing work and participation, making it an example of active income.',
              points: 10
            }
          ]
        },

        {
          slug: 'increasing-earning-power',

          title: 'Lesson 3 — Increasing Your Earning Power',

          estimatedDuration: 12,

          order: 3,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'One of the most powerful long-term financial skills is the ability to increase your capacity to create value. Earning power is influenced by knowledge, technical skills, communication, experience, reputation, problem-solving ability, and the demand for the value you can provide.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Skills and Economic Value'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'A skill becomes financially valuable when it solves problems that people or organizations are willing to pay to solve. Learning should therefore involve both developing capability and understanding where that capability creates value.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Long-Term Approach'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Increasing earning power is usually a process rather than a single event. It can involve education, deliberate practice, building a portfolio, gaining experience, networking, improving communication, negotiating responsibly, or developing entrepreneurial ability.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Career Example',
                text:
                  'A student who learns a useful digital skill can begin with small projects, build evidence of competence, improve through feedback, and eventually qualify for opportunities that pay more than their original level of experience.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Earning power is connected to the value you can create.',
                  'Skills become economically valuable when they solve meaningful problems.',
                  'Career development is usually a long-term process.',
                  'Learning, practice, experience, and communication can increase earning potential.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which approach can contribute to stronger earning power over time?',
              options: [
                'Developing valuable skills and experience',
                'Avoiding all learning',
                'Spending every increase in income immediately',
                'Assuming income must never change'
              ],
              correctAnswer: 0,
              explanation:
                'Developing useful skills and experience can increase the value a person is able to provide and therefore improve future earning opportunities.',
              points: 10
            }
          ]
        }
      ]
    },

    /*
     * =======================================================
     * MODULE 3
     * =======================================================
     */

    {
      slug: 'expenses-and-spending',

      title: 'Module 3 — Expenses and Spending',

      description:
        'Learn how expenses work, how to distinguish needs from wants, identify spending patterns, and make more deliberate purchasing decisions.',

      order: 3,

      lessons: [
        {
          slug: 'understanding-expenses',

          title: 'Lesson 1 — Understanding Expenses',

          estimatedDuration: 12,

          order: 1,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Expenses represent money leaving your financial system or obligations that require financial resources. Every person has expenses, but not every expense has the same importance, frequency, flexibility, or long-term impact.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Fixed and Variable Expenses'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Some expenses are relatively stable from one period to another. These are often described as fixed expenses. Others change depending on usage, circumstances, or choices and can be considered variable expenses. The exact classification can depend on the situation.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Essential and Discretionary Expenses'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Another useful distinction is between essential and discretionary spending. Essential expenses generally support basic living or important obligations. Discretionary expenses are more flexible and often relate to entertainment, convenience, lifestyle, or personal preferences.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Example',
                text:
                  'Rent may be a relatively fixed and essential expense. Entertainment may be discretionary and variable. Food can contain both essential and discretionary components because basic nutrition is necessary while some food purchases may be driven more by preference.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Expenses are resources leaving your financial system or obligations requiring payment.',
                  'Some expenses are relatively fixed while others vary.',
                  'Some expenses are essential while others are discretionary.',
                  'Understanding the type of expense improves financial decision-making.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which description best fits a discretionary expense?',
              options: [
                'An expense that is generally flexible and connected to personal preference or lifestyle',
                'An expense that can never change',
                'Money received from employment',
                'A financial asset'
              ],
              correctAnswer: 0,
              explanation:
                'Discretionary expenses are generally more flexible and can relate to lifestyle, entertainment, convenience, or preference.',
              points: 10
            }
          ]
        },

        {
          slug: 'needs-vs-wants',

          title: 'Lesson 2 — Needs vs Wants',

          estimatedDuration: 12,

          order: 2,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'One of the most useful questions in personal finance is whether a purchase is necessary or optional. However, needs and wants should not be treated as rigid categories that apply identically to everyone. Circumstances, responsibilities, location, health, work, education, and personal goals can change what is necessary.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Purpose of the Distinction'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'The purpose of identifying needs and wants is not to eliminate enjoyment. It is to create awareness. When you know which purchases are essential and which are optional, you can decide where your limited resources should go.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Questions to Ask Before Spending'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Before making a purchase, ask: Do I need this now? What problem does it solve? Is there a cheaper alternative? Will I still value it later? What financial goal could this money support instead? These questions create a pause between desire and action.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Practical Example',
                text:
                  'Suppose you planned to save ₦50,000 this month but are considering a ₦25,000 purchase. Instead of immediately asking whether the purchase is good or bad, compare it with your goal. The decision becomes a trade-off: spend ₦25,000 now or keep that money working toward the future objective.'
              }
            },

            {
              order: 7,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Remember',
                text:
                  'Financial discipline does not mean never spending money on things you enjoy. It means spending intentionally instead of spending automatically.'
              }
            },

            {
              order: 8,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Needs and wants depend partly on personal circumstances.',
                  'The distinction helps reveal trade-offs.',
                  'Intentional spending is more useful than judging every purchase as simply good or bad.',
                  'Financial goals become easier to protect when spending decisions are deliberate.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'What is the main purpose of distinguishing needs from wants?',
              options: [
                'To eliminate all enjoyable spending',
                'To make spending decisions more intentional',
                'To prevent people from earning money',
                'To make every expense identical'
              ],
              correctAnswer: 1,
              explanation:
                'The distinction helps people understand trade-offs and allocate limited resources more intentionally.',
              points: 10
            },

            {
              order: 2,
              questionType: 'true-false',
              question:
                'Financial discipline means never spending money on things you enjoy.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 1,
              explanation:
                'Financial discipline is about intentional allocation of resources, not eliminating all enjoyment.',
              points: 10
            }
          ]
        },

        {
          slug: 'spending-triggers',

          title: 'Lesson 3 — Spending Triggers and Habits',

          estimatedDuration: 14,

          order: 3,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Spending decisions are not always purely mathematical. Emotions, social pressure, convenience, advertising, boredom, stress, celebration, fear of missing out, and habits can influence when and why people spend. Understanding these influences can improve financial decision-making.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Common Spending Triggers'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'A spending trigger is a situation, emotion, thought, environment, or event that increases the likelihood of spending. Common examples include seeing a promotion, feeling stressed, receiving unexpected income, comparing yourself with others, or simply being in an environment designed to encourage purchases.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Pause Technique'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'One simple strategy is to create a pause between wanting something and purchasing it. The pause can be a few minutes for a small purchase or a longer waiting period for a significant purchase. The goal is not to automatically reject the purchase but to give yourself time to evaluate it.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Reflection Activity',
                text:
                  'Think about three purchases you made recently. For each one, identify what happened immediately before the purchase. Were you hungry, bored, excited, stressed, influenced by someone, responding to a promotion, or solving a genuine need? Recognizing patterns can help you make better decisions later.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Spending is influenced by more than mathematics.',
                  'Emotions, social pressure, advertising, and habits can affect decisions.',
                  'Identifying spending triggers increases awareness.',
                  'Creating a pause can reduce automatic purchasing.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'What is a spending trigger?',
              options: [
                'A factor that increases the likelihood of making a purchase',
                'A guaranteed investment return',
                'A type of bank account',
                'A monthly salary'
              ],
              correctAnswer: 0,
              explanation:
                'A spending trigger can be an emotion, environment, thought, event, or other factor that makes spending more likely.',
              points: 10
            }
          ]
        },

        {
          slug: 'opportunity-cost',

          title: 'Lesson 4 — Opportunity Cost and Financial Trade-Offs',

          estimatedDuration: 12,

          order: 4,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Every financial decision involves choices because money is limited. When you use money for one purpose, you may give up another possible use. This concept is called opportunity cost.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Understanding Trade-Offs'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Suppose you have ₦100,000 available. You could use it for education, a new device, savings, debt repayment, transportation, entertainment, or another goal. Choosing one option means the money cannot simultaneously perform all the other roles.'
              }
            },

            {
              order: 4,
              type: 'example',
              data: {
                title: 'Financial Trade-Off',
                text:
                  'If you spend ₦40,000 on an optional purchase, the opportunity cost could be the saving goal, debt repayment, course, emergency reserve, or other useful purpose that ₦40,000 could have supported.'
              }
            },

            {
              order: 5,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Key Question',
                text:
                  'Before spending, ask: What else could this money do for me?'
              }
            },

            {
              order: 6,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Money is limited and must be allocated among competing priorities.',
                  'Opportunity cost represents what you give up when choosing one option.',
                  'Good financial decisions consider both the chosen option and the alternatives.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'What is opportunity cost?',
              options: [
                'The value of the alternative given up when making a choice',
                'The amount of money in a bank account',
                'A guaranteed profit',
                'A monthly expense'
              ],
              correctAnswer: 0,
              explanation:
                'Opportunity cost refers to the value of the best alternative you give up when making a decision.',
              points: 10
            }
          ]
        }
      ]
    },

    /*
     * =======================================================
     * MODULE 4
     * =======================================================
     */

    {
      slug: 'cash-flow-and-financial-control',

      title: 'Module 4 — Cash Flow and Financial Control',

      description:
        'Learn how to track money coming in and going out, calculate net cash flow, identify financial pressure points, and understand why cash-flow control matters.',

      order: 4,

      lessons: [
        {
          slug: 'what-is-cash-flow',

          title: 'Lesson 1 — What Is Cash Flow?',

          estimatedDuration: 12,

          order: 1,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Cash flow describes the movement of money into and out of a financial system during a period. For an individual, this can mean salary received, business payments, transfers, bills, food purchases, transportation, subscriptions, debt payments, savings, and other financial movements.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Basic Cash-Flow Formula'
              }
            },

            {
              order: 3,
              type: 'formula',
              data: {
                expression:
                  'Net Cash Flow = Total Income − Total Expenses'
              }
            },

            {
              order: 4,
              type: 'text',
              data: {
                text:
                  'If income is greater than expenses, the result is positive. If expenses are greater than income, the result is negative. If they are equal, net cash flow is zero.'
              }
            },

            {
              order: 5,
              type: 'example',
              data: {
                title: 'Example',
                text:
                  'If you receive ₦300,000 during a month and spend ₦220,000, your net cash flow is ₦80,000. That positive amount represents financial room that could potentially support saving, investing, debt repayment, or another goal.'
              }
            },

            {
              order: 6,
              type: 'callout',
              data: {
                variant: 'warning',
                title: 'Important',
                text:
                  'A high income does not guarantee positive cash flow. If expenses consistently exceed income, even a high earner can experience negative cash flow.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Cash flow measures money moving into and out of a financial system.',
                  'Net cash flow equals income minus expenses.',
                  'Positive cash flow creates financial flexibility.',
                  'Negative cash flow indicates that spending is exceeding income during the period.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'calculate',
              question:
                'You receive ₦300,000 in income and spend ₦220,000. What is your net cash flow?',
              options: [],
              correctAnswer: 80000,
              explanation:
                'Net cash flow = ₦300,000 − ₦220,000 = ₦80,000.',
              points: 10
            },

            {
              order: 2,
              questionType: 'multiple-choice',
              question:
                'Which situation produces positive cash flow?',
              options: [
                'Expenses are greater than income.',
                'Income is greater than expenses.',
                'Expenses are exactly double income.',
                'There is no income.'
              ],
              correctAnswer: 1,
              explanation:
                'Positive cash flow occurs when total income exceeds total expenses.',
              points: 10
            }
          ]
        },

        {
          slug: 'positive-and-negative-cash-flow',

          title: 'Lesson 2 — Positive and Negative Cash Flow',

          estimatedDuration: 12,

          order: 2,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Positive and negative cash flow provide useful information about the direction of a person’s finances during a particular period. Positive cash flow means more money came in than went out. Negative cash flow means more money went out than came in.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Why Positive Cash Flow Matters'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Positive cash flow creates choices. The excess can potentially be directed toward an emergency fund, savings goal, debt repayment, investment, education, business development, or another priority. Positive cash flow does not automatically create wealth, but it creates financial flexibility.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Understanding Negative Cash Flow'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Negative cash flow means expenses exceed income during the period. If this happens occasionally because of a planned large expense, it may not necessarily indicate a long-term problem. Persistent negative cash flow, however, requires attention because it can lead to depletion of savings or increased borrowing.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Two Different Situations',
                text:
                  'Person A earns ₦200,000 and spends ₦170,000, producing ₦30,000 positive cash flow. Person B earns ₦500,000 but spends ₦550,000, producing ₦50,000 negative cash flow. Person B earns more but has weaker cash flow during that period.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Positive cash flow creates financial flexibility.',
                  'Negative cash flow means spending exceeds income during the period.',
                  'One unusual negative month does not necessarily define a person’s overall finances.',
                  'Persistent negative cash flow requires investigation and corrective action.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'true-false',
              question:
                'A person can earn more money than another person and still have worse cash flow.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 0,
              explanation:
                'Cash flow depends on the relationship between income and expenses, not income alone.',
              points: 10
            }
          ]
        },

        {
          slug: 'tracking-money',

          title: 'Lesson 3 — Tracking Where Your Money Goes',

          estimatedDuration: 14,

          order: 3,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Many people have a general idea of what they spend but cannot accurately explain where their money went at the end of a month. Tracking spending creates visibility. Without visibility, financial decisions are often based on memory, assumptions, or emotion.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'A Simple Tracking System'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Start by recording every significant financial movement. Categorize each item using simple categories such as housing, food, transportation, education, debt, savings, entertainment, communication, and other personal categories that make sense for your situation.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Look for Patterns'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'The purpose of tracking is not to create guilt. It is to discover patterns. You may find that small purchases happen frequently, that a particular category consumes more money than expected, or that certain expenses occur at predictable times.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Practical Activity',
                text:
                  'For the next seven days, record every purchase you make. At the end of the week, group the purchases into categories. Then ask which spending was necessary, which was optional, and which purchases surprised you.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Tracking creates visibility.',
                  'Categorizing expenses makes patterns easier to identify.',
                  'The goal is awareness rather than guilt.',
                  'Small repeated expenses can become significant over time.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'What is the main purpose of tracking spending?',
              options: [
                'To create guilt about every purchase',
                'To understand financial patterns and make better decisions',
                'To prevent all spending',
                'To guarantee wealth'
              ],
              correctAnswer: 1,
              explanation:
                'Tracking provides visibility into financial behavior and helps people make more informed decisions.',
              points: 10
            }
          ]
        },

        {
          slug: 'cash-flow-practical-exercise',

          title: 'Lesson 4 — Cash-Flow Practical Exercise',

          estimatedDuration: 15,

          order: 4,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'This practical exercise combines the concepts from the cash-flow module. You will examine a fictional monthly financial situation and determine whether the person has positive or negative cash flow.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Scenario'
              }
            },

            {
              order: 3,
              type: 'example',
              data: {
                title: 'Monthly Financial Situation',
                text:
                  'Amaka receives ₦350,000 in monthly income. Her monthly expenses are: housing ₦100,000, food ₦60,000, transportation ₦35,000, communication ₦15,000, education ₦20,000, entertainment ₦25,000, and other expenses ₦30,000.'
              }
            },

            {
              order: 4,
              type: 'formula',
              data: {
                expression:
                  'Total Expenses = ₦100,000 + ₦60,000 + ₦35,000 + ₦15,000 + ₦20,000 + ₦25,000 + ₦30,000 = ₦285,000'
              }
            },

            {
              order: 5,
              type: 'formula',
              data: {
                expression:
                  'Net Cash Flow = ₦350,000 − ₦285,000 = ₦65,000'
              }
            },

            {
              order: 6,
              type: 'text',
              data: {
                text:
                  'Amaka therefore has ₦65,000 of positive cash flow during this month. The next financial decision is not automatically to spend the ₦65,000. She should consider her emergency fund, financial goals, obligations, and other priorities.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Practical Takeaway',
                points: [
                  'List income first.',
                  'List all major expenses.',
                  'Add the expenses together.',
                  'Subtract total expenses from total income.',
                  'Use the resulting cash flow to guide the next financial decision.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'calculate',
              question:
                'Using Amaka’s scenario, what is her net cash flow?',
              options: [],
              correctAnswer: 65000,
              explanation:
                'Her total expenses are ₦285,000. ₦350,000 − ₦285,000 = ₦65,000 positive cash flow.',
              points: 10
            }
          ]
        }
      ]
    },

    /*
     * =======================================================
     * MODULE 5
     * =======================================================
     */

    {
      slug: 'saving-and-financial-goals',

      title: 'Module 5 — Saving and Financial Goals',

      description:
        'Learn why saving matters, how to create financial goals, how emergency funds work, and how to build a simple system for directing money toward the future.',

      order: 5,

      lessons: [
        {
          slug: 'why-saving-matters',

          title: 'Lesson 1 — Why Saving Matters',

          estimatedDuration: 12,

          order: 1,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Saving means intentionally setting aside resources for future use rather than consuming everything immediately. Saving creates a bridge between today’s income and tomorrow’s needs, opportunities, and goals.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Reasons People Save'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'People save for many reasons: emergencies, education, major purchases, business opportunities, travel, future responsibilities, and long-term financial goals. Saving can also reduce the need to rely on expensive borrowing when an unexpected expense occurs.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Saving Is About a System'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Saving becomes easier when it is treated as a planned financial activity rather than whatever happens to remain at the end of the month. A person can choose a specific goal, amount, frequency, and method for setting money aside.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Example',
                text:
                  'If someone wants to save ₦120,000 over six months, a simple starting calculation is ₦120,000 ÷ 6 = ₦20,000 per month. The person can then evaluate whether that target fits their income and expenses.'
              }
            },

            {
              order: 7,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Saving transfers resources from present consumption toward future use.',
                  'People save for emergencies, goals, opportunities, and future responsibilities.',
                  'A planned saving system is generally more reliable than hoping money remains at the end of the month.',
                  'Saving targets should be realistic in relation to income and expenses.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'calculate',
              question:
                'If your goal is to save ₦120,000 in six months, how much would you need to save each month if the amount is divided equally?',
              options: [],
              correctAnswer: 20000,
              explanation:
                '₦120,000 divided by 6 months equals ₦20,000 per month.',
              points: 10
            }
          ]
        },

        {
          slug: 'financial-goals',

          title: 'Lesson 2 — Setting Financial Goals',

          estimatedDuration: 14,

          order: 2,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'A financial goal gives your money a purpose. Without a clear goal, saving can feel abstract and spending decisions become harder to evaluate. A useful goal describes what you want, how much it requires, and when you want to achieve it.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Short-Term Goals'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Short-term goals may include saving for a course, a small purchase, an upcoming obligation, or a short-term emergency reserve. The exact timeframe depends on the individual situation.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Medium-Term and Long-Term Goals'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Medium- and long-term goals may include education, starting a business, purchasing an asset, building long-term investments, or preparing for future financial independence. Longer time horizons require greater patience and regular review.'
              }
            },

            {
              order: 6,
              type: 'heading',
              data: {
                level: 2,
                text: 'Make the Goal Measurable'
              }
            },

            {
              order: 7,
              type: 'example',
              data: {
                title: 'Weak vs Strong Goal',
                text:
                  '“I want to save more” is vague. “I want to save ₦180,000 within nine months by setting aside ₦20,000 each month” is more measurable and easier to monitor.'
              }
            },

            {
              order: 8,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Financial goals give money a specific purpose.',
                  'Goals can be short-term, medium-term, or long-term.',
                  'Measurable goals are easier to track.',
                  'A realistic target should match the person’s financial capacity.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which is the strongest example of a measurable financial goal?',
              options: [
                'I want to save more.',
                'I will try to be better with money.',
                'I will save ₦20,000 each month for nine months to reach ₦180,000.',
                'I hope I have more money someday.'
              ],
              correctAnswer: 2,
              explanation:
                'The third option specifies an amount, frequency, and timeframe, making it measurable.',
              points: 10
            }
          ]
        },

        {
          slug: 'emergency-funds',

          title: 'Lesson 3 — Emergency Funds',

          estimatedDuration: 14,

          order: 3,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'An emergency fund is money set aside for unexpected or urgent financial needs. The purpose is to create a financial buffer so that an unexpected expense does not immediately force someone to sell assets, miss essential payments, or rely on expensive borrowing.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Examples of Emergencies'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Potential emergencies can include urgent repairs, unexpected medical or family-related expenses, sudden loss of income, essential travel, or other significant unplanned costs. The exact definition depends on the person’s circumstances.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Emergency Funds Are Not Everyday Spending'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'A useful emergency fund should be separated mentally and, where appropriate, operationally from everyday spending money. If the money is constantly used for ordinary purchases, it cannot provide the intended financial buffer.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Building Gradually',
                text:
                  'Someone with limited income may not be able to create a large emergency reserve immediately. They can begin with a manageable target and gradually increase it as their financial situation improves.'
              }
            },

            {
              order: 7,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Key Principle',
                text:
                  'An emergency fund is designed for resilience, not for maximizing returns. Its role should be considered separately from long-term investing goals.'
              }
            },

            {
              order: 8,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'An emergency fund provides a financial buffer.',
                  'It can reduce dependence on emergency borrowing.',
                  'Emergency money should be protected for genuine unexpected needs.',
                  'Building gradually is better than waiting until you can save a large amount.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'What is the primary purpose of an emergency fund?',
              options: [
                'To pay for everyday entertainment',
                'To provide a financial buffer for unexpected needs',
                'To guarantee investment profits',
                'To increase monthly spending'
              ],
              correctAnswer: 1,
              explanation:
                'An emergency fund is designed to provide financial resilience when unexpected expenses or income disruptions occur.',
              points: 10
            }
          ]
        },

        {
          slug: 'building-a-money-system',

          title: 'Lesson 4 — Building Your Personal Money System',

          estimatedDuration: 15,

          order: 4,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Financial success is rarely produced by one decision. It is usually influenced by repeated systems and habits. A personal money system is a simple structure that helps you know what comes in, what goes out, what you are saving for, and what needs attention.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Four Basic Questions'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
              'A useful personal money system should answer four questions: How much money is coming in? Where is the money going? What future goals am I funding? What financial risks or obligations need attention?'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'A Simple Monthly Routine'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'At the beginning of a financial period, estimate your income and major expenses. During the period, track important spending. At the end, compare what actually happened with what you expected. Identify one or two improvements for the next period rather than attempting to change everything at once.'
              }
            },

            {
              order: 6,
              type: 'example',
              data: {
                title: 'Simple Routine',
                text:
                  'A student might receive an allowance or income, set aside a planned amount for savings, allocate money to essential expenses, reserve a small amount for discretionary spending, and review the results at the end of the month.'
              }
            },

            {
              order: 7,
              type: 'heading',
              data: {
                level: 2,
                text: 'Consistency Beats Complexity'
              }
            },

            {
              order: 8,
              type: 'text',
              data: {
                text:
                  'A complicated financial system that you never use is less useful than a simple system you follow consistently. Start with visibility, intentional allocation, regular review, and gradual improvement.'
              }
            },

            {
              order: 9,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Financial systems turn good intentions into repeatable actions.',
                  'Know your income.',
                  'Track your expenses.',
                  'Fund meaningful goals.',
                  'Review your results regularly.',
                  'Improve gradually rather than trying to change everything at once.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which approach is generally more useful for building a personal money system?',
              options: [
                'Creating a complicated system that is never reviewed',
                'Using a simple system consistently and improving it over time',
                'Ignoring expenses',
                'Spending first and hoping money remains'
              ],
              correctAnswer: 1,
              explanation:
                'A simple system that is consistently used can provide visibility and support better financial decisions.',
              points: 10
            }
          ]
        }
      ]
    },

    /*
     * =======================================================
     * FINAL COURSE ASSESSMENT
     * =======================================================
     */

    {
      slug: 'money-basics-final-review',

      title: 'Final Review — Putting the Foundations Together',

      description:
        'Review the major concepts from Money Basics and connect money, income, expenses, cash flow, spending, saving, and financial goals into one practical framework.',

      order: 6,

      lessons: [
        {
          slug: 'final-financial-review',

          title: 'Final Review — Your Money Framework',

          estimatedDuration: 20,

          order: 1,

          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'You have now explored the major foundations of personal finance. The goal is not to memorize isolated definitions. The goal is to understand how the concepts connect.'
              }
            },

            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Complete Picture'
              }
            },

            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Income provides financial resources. Expenses allocate those resources toward current needs, obligations, and preferences. Cash flow shows the relationship between money coming in and money going out. Positive cash flow creates flexibility. Saving directs some resources toward future needs and goals. Financial goals give saving and spending decisions a purpose.'
              }
            },

            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Financial Decision Cycle'
              }
            },

            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'A simple financial decision cycle can be described as: earn → understand → allocate → spend → save → review → improve. This is not a rigid formula, but it provides a useful framework for thinking about personal money management.'
              }
            },

            {
              order: 6,
              type: 'heading',
              data: {
                level: 2,
                text: 'Your Practical Challenge'
              }
            },

            {
              order: 7,
              type: 'example',
              data: {
                title: 'Build Your Own Money Snapshot',
                text:
                  'Write down your major sources of income, your largest expenses, your current savings goal, one financial risk you want to prepare for, and one financial habit you want to improve. Then calculate your approximate monthly net cash flow.'
              }
            },

            {
              order: 8,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Course Completion Principle',
                text:
                  'The purpose of financial education is not to make every decision for you. It is to give you better information and a stronger framework for making your own decisions.'
              }
            },

            {
              order: 9,
              type: 'summary',
              data: {
                title: 'Final Takeaways',
                points: [
                  'Money is a tool that should be managed intentionally.',
                  'Income is only one part of financial health.',
                  'Expenses determine where resources are allocated.',
                  'Cash flow reveals whether money coming in is greater than money going out.',
                  'Spending decisions involve trade-offs.',
                  'Saving creates resources for future goals and unexpected needs.',
                  'Financial goals give money a purpose.',
                  'Consistent systems and habits can improve financial decision-making over time.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which formula correctly represents net cash flow?',
              options: [
                'Net Cash Flow = Expenses − Income',
                'Net Cash Flow = Income − Expenses',
                'Net Cash Flow = Income + Expenses',
                'Net Cash Flow = Savings × Income'
              ],
              correctAnswer: 1,
              explanation:
                'Net cash flow is calculated by subtracting total expenses from total income.',
              points: 10
            },

            {
              order: 2,
              questionType: 'multiple-choice',
              question:
                'Why is positive cash flow valuable?',
              options: [
                'It guarantees wealth.',
                'It creates financial flexibility that can be directed toward goals and obligations.',
                'It eliminates every financial risk.',
                'It means a person never needs to budget.'
              ],
              correctAnswer: 1,
              explanation:
                'Positive cash flow creates room that can potentially be directed toward saving, investing, debt repayment, education, business, or other priorities.',
              points: 10
            },

            {
              order: 3,
              questionType: 'multiple-choice',
              question:
                'What is one important purpose of an emergency fund?',
              options: [
                'To increase discretionary spending',
                'To provide a financial buffer for unexpected needs',
                'To guarantee investment returns',
                'To avoid tracking expenses'
              ],
              correctAnswer: 1,
              explanation:
                'Emergency funds are designed to provide a financial buffer when unexpected expenses or income disruptions occur.',
              points: 10
            },

            {
              order: 4,
              questionType: 'true-false',
              question:
                'A person can earn a high income and still experience financial difficulty.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 0,
              explanation:
                'High income does not automatically create positive cash flow or strong financial habits. Spending, obligations, debt, saving, and other factors matter.',
              points: 10
            },

            {
              order: 5,
              questionType: 'multiple-choice',
              question:
                'What does opportunity cost help you understand?',
              options: [
                'The alternative you give up when making a financial choice',
                'Your guaranteed monthly income',
                'The amount of money in your wallet',
                'The number of purchases you make'
              ],
              correctAnswer: 0,
              explanation:
                'Opportunity cost helps you recognize what alternative use of your resources you give up when choosing one option.',
              points: 10
            },

            {
              order: 6,
              questionType: 'true-false',
              question:
                'The goal of financial discipline is to eliminate all spending on things you enjoy.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 1,
              explanation:
                'Financial discipline is about intentional allocation and making decisions that align with your priorities, not eliminating all enjoyment.',
              points: 10
            }
          ]
        }
      ]
    }
  ]
};
