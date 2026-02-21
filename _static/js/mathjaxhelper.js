window.MathJax = {
  loader: {
    load: ['[tex]/tagformat']
  },
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    packages: {'[+]': ['tagformat']},
    tagSide: 'left',
    macros: {
      RR: '{\\bf R}',
      bold: ['{\\bf #1}',1]
    },
    tagformat: {
       tag: (n) => '[' + n + ']'
    }
  }
};
