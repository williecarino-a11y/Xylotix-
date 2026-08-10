module.exports = {
  course: {
    slug: 'money-basics',
    title: 'Money Basics',
    description:
      'Understanding how money works, cash flow fundamentals, and wealth building blocks.',
    category: 'Foundations',
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
        'Learn the difference between income, expenses, assets, and liabilities.',
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
              type: 'callout',
              data: {
                variant: 'info',
                title: 'Key Takeaway',
                text:
                  'Money itself has no intrinsic value; its usefulness comes from its ability to facilitate exchange and represent economic value.'
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question:
                'Which of the following best describes a primary function of money?',
              options: [
                'A medium of exchange',
                'A decoration',
                'A fixed liability',
                'An infinite resource'
              ],
              correctAnswer: 0,
              explanation:
                'Money serves as a medium of exchange, making trade easier than direct barter.',
              points: 10
            }
          ]
        },

        {
          slug: 'income-vs-expenses',
          title: 'Income vs Expenses',
          estimatedDuration: 15,
          order: 2,
          published: true,

          contentBlocks: [
            {
              order: 1,
              type: 'text',
              data: {
                text:
                  'Cash flow is the movement of money into and out of your financial life. Building wealth requires managing the relationship between income and expenses.'
              }
            },
            {
              order: 2,
              type: 'example',
              data: {
                title: 'Monthly Net Flow Example',
                description:
                  'Earning ₦300,000 while spending ₦210,000 produces a positive net cash flow of ₦90,000.'
              }
            }
          ],

          quizzes: [
            {
              order: 1,
              questionType: 'multiple-choice',
              question: 'What defines positive cash flow?',
              options: [
                'Expenses are higher than income',
                'Income is higher than expenses',
                'Zero savings balance',
                'Constant debt accumulation'
              ],
              correctAnswer: 1,
              explanation:
                'Positive cash flow occurs when money coming in exceeds money going out.',
              points: 10
            }
          ]
        }
      ]
    }
  ]
};
