const moneyBasics = {
  course: {
    slug: 'money-basics',
    title: 'Money Basics',
    category: 'Foundations',
    description:
      'Build a strong foundation in personal finance by understanding what money is, how income and expenses work, and how cash flow shapes financial decisions.',
    difficulty: 'Beginner',
    estimatedDuration: 45,
    order: 1,
    published: true
  },

  modules: [
    {
      slug: 'understanding-cash-flow',
      title: 'Understanding Cash Flow',
      description:
        'Learn how money enters and leaves your financial life and why understanding cash flow is fundamental to making better financial decisions.',
      order: 1,

      lessons: [
        {
          slug: 'what-is-money',
          title: 'What is Money?',
          estimatedDuration: 10,
          order: 1,
          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Money is a medium of exchange, a unit of account, and a store of value. Understanding its true nature is the first step to financial freedom.'
              }
            },
            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'The Three Core Functions of Money'
              }
            },
            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Money performs three fundamental functions. First, it acts as a medium of exchange, allowing people to trade without relying on barter. Second, it provides a unit of account, giving us a common way to measure and compare the value of goods, services, income, and expenses. Third, it serves as a store of value, allowing purchasing power to be transferred from the present into the future.'
              }
            },
            {
              order: 4,
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Key Takeaway',
                text:
                  'Money itself has no intrinsic value; its usefulness comes from its ability to facilitate exchange and represent economic value.'
              }
            },
            {
              order: 5,
              type: 'heading',
              data: {
                level: 2,
                text: 'Why Understanding Money Matters'
              }
            },
            {
              order: 6,
              type: 'text',
              data: {
                text:
                  'Financial decisions become easier to understand when you recognize what money represents. Earning money creates financial resources, spending money allocates those resources, saving delays consumption, and investing attempts to grow resources over time.'
              }
            },
            {
              order: 7,
              type: 'example',
              data: {
                title: 'Simple Example',
                text:
                  'Imagine you receive ₦100,000 in income. If you spend ₦70,000 and keep ₦30,000, your money has been allocated between current consumption and future use. The important question is not simply how much you earn, but what happens to the money after you receive it.'
              }
            },
            {
              order: 8,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Money functions as a medium of exchange.',
                  'Money provides a common unit for measuring economic value.',
                  'Money can store purchasing power for future use.',
                  'Understanding how money moves is more useful than simply knowing how much money you have.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which of the following is NOT one of the three traditional functions of money?',
              options: [
                'Medium of exchange',
                'Unit of account',
                'Store of value',
                'Guarantee of profit'
              ],
              correctAnswer: 3,
              explanation:
                'The three traditional functions of money are medium of exchange, unit of account, and store of value. Money does not guarantee profit.',
              points: 10
            },
            {
              order: 2,
              questionType: 'multiple-choice',
              question:
                'What does it mean for money to act as a unit of account?',
              options: [
                'It allows people to compare and measure economic value using a common standard.',
                'It guarantees that money will increase in value.',
                'It prevents people from spending money.',
                'It allows people to receive money without working.'
              ],
              correctAnswer: 0,
              explanation:
                'A unit of account provides a common standard for expressing and comparing the value of goods, services, income, and expenses.',
              points: 10
            },
            {
              order: 3,
              questionType: 'true-false',
              question:
                'Understanding money is only about learning how to earn more of it.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 1,
              explanation:
                'Financial understanding also involves how money is spent, saved, allocated, protected, and potentially invested.',
              points: 10
            }
          ]
        },

        {
          slug: 'income-vs-expenses',
          title: 'Income vs Expenses',
          estimatedDuration: 10,
          order: 2,
          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Cash flow describes the movement of money into and out of your financial life. Income represents money coming in, while expenses represent money going out. Understanding the relationship between the two is one of the foundations of financial management.'
              }
            },
            {
              order: 2,
              type: 'heading',
              data: {
                level: 2,
                text: 'Income'
              }
            },
            {
              order: 3,
              type: 'text',
              data: {
                text:
                  'Income is money or economic value you receive. Common sources include salary, wages, business revenue, freelance payments, commissions, interest, dividends, rent, and other legitimate sources of earnings.'
              }
            },
            {
              order: 4,
              type: 'heading',
              data: {
                level: 2,
                text: 'Expenses'
              }
            },
            {
              order: 5,
              type: 'text',
              data: {
                text:
                  'Expenses are the costs you incur when purchasing goods and services or meeting financial obligations. Examples include housing, transportation, food, utilities, education, subscriptions, debt payments, and entertainment.'
              }
            },
            {
              order: 6,
              type: 'heading',
              data: {
                level: 2,
                text: 'Cash Flow'
              }
            },
            {
              order: 7,
              type: 'formula',
              data: {
                expression:
                  'Net Cash Flow = Total Income − Total Expenses'
              }
            },
            {
              order: 8,
              type: 'text',
              data: {
                text:
                  'When income is greater than expenses, you have positive cash flow. When expenses are greater than income, you have negative cash flow. Positive cash flow can create room for saving, investing, debt repayment, and other financial goals.'
              }
            },
            {
              order: 9,
              type: 'example',
              data: {
                title: 'Example',
                text:
                  'Suppose you receive ₦250,000 during a month and your total expenses are ₦190,000. Your net cash flow is ₦60,000. That ₦60,000 represents money that was not consumed by your expenses and can potentially be directed toward savings, investing, debt repayment, or another financial goal.'
              }
            },
            {
              order: 10,
              type: 'callout',
              data: {
                variant: 'warning',
                title: 'Important',
                text:
                  'A high income does not automatically mean strong finances. If expenses consistently rise with income, a person can earn a lot while still having little or no positive cash flow.'
              }
            },
            {
              order: 11,
              type: 'heading',
              data: {
                level: 2,
                text: 'Needs vs Wants'
              }
            },
            {
              order: 12,
              type: 'text',
              data: {
                text:
                  'A useful way to understand expenses is to distinguish between needs and wants. Needs are expenses required for basic living or important obligations. Wants are expenses that improve comfort, convenience, or enjoyment but are generally not essential. The distinction is not always absolute, so the goal is to make deliberate decisions rather than label every expense as good or bad.'
              }
            },
            {
              order: 13,
              type: 'summary',
              data: {
                title: 'Lesson Summary',
                points: [
                  'Income is money coming into your financial life.',
                  'Expenses are money going out.',
                  'Net cash flow equals income minus expenses.',
                  'Positive cash flow creates financial flexibility.',
                  'Higher income does not guarantee financial stability.',
                  'Understanding your expenses helps you make intentional financial decisions.'
                ]
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'calculate',
              question:
                'You receive ₦300,000 in income during a month and spend ₦220,000. What is your net cash flow?',
              options: [],
              correctAnswer: 80000,
              explanation:
                'Net cash flow is calculated as income minus expenses: ₦300,000 − ₦220,000 = ₦80,000.',
              points: 10
            },
            {
              order: 2,
              questionType: 'multiple-choice',
              question:
                'Which statement best describes positive cash flow?',
              options: [
                'Expenses are greater than income.',
                'Income is greater than expenses.',
                'Income and expenses are always equal.',
                'There is no income or spending.'
              ],
              correctAnswer: 1,
              explanation:
                'Positive cash flow occurs when total income is greater than total expenses during a given period.',
              points: 10
            },
            {
              order: 3,
              questionType: 'multiple-choice',
              question:
                'Which of the following is an example of income?',
              options: [
                'Rent payment',
                'Grocery purchase',
                'Salary received',
                'Electricity bill'
              ],
              correctAnswer: 2,
              explanation:
                'A salary received is money coming into your financial life, making it a form of income.',
              points: 10
            },
            {
              order: 4,
              questionType: 'true-false',
              question:
                'Someone with a high income can still have negative cash flow.',
              options: [
                'True',
                'False'
              ],
              correctAnswer: 0,
              explanation:
                'A person can earn a high income but still spend more than they earn, resulting in negative cash flow.',
              points: 10
            }
          ]
        }
      ]
    }
  ]
};

module.exports = moneyBasics;
