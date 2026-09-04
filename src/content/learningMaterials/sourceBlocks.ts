export type MaterialTextRun = { text: string; bold?: true; italic?: true; math?: true; superscript?: true; subscript?: true };
export type MaterialParagraphBlock = { type: "paragraph"; variant: "body" | "listItem" | "sectionHeading" | "subheading"; align: "left" | "center" | "right" | "both"; runs: MaterialTextRun[] };
export type MaterialImageBlock = { type: "image"; src: string; alt: string };
export type MaterialTableCell = { blocks: MaterialContentBlock[]; colSpan?: number };
export type MaterialTableBlock = { type: "table"; variant: "grid" | "layout" | "graphPaper"; columnWidths: number[]; rows: { cells: MaterialTableCell[] }[] };
export type MaterialContentBlock = MaterialParagraphBlock | MaterialImageBlock | MaterialTableBlock;

export const materialSourceBlocks: Record<string, MaterialContentBlock[]> =
{
  "algebra-graphs": [
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        5494,
        5494
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[y=x - 3\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "layout",
                  "columnWidths": [
                    390,
                    516,
                    596,
                    516,
                    596,
                    516,
                    596,
                    336
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-3"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-2,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-2"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-1,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-1"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-0,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "0"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "0,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "1"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "1,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "2"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "2,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "3"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Побудуйте графік",
                      "bold": true
                    },
                    {
                      "text": " функції",
                      "bold": true
                    },
                    {
                      "text": ":",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "graphPaper",
                  "columnWidths": [
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[y= \\frac{1}{2}x-2;\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "layout",
                  "columnWidths": [
                    567,
                    567,
                    567,
                    567,
                    567,
                    567,
                    567,
                    567
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Побудуйте графік",
                      "bold": true
                    },
                    {
                      "text": " функції:",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "graphPaper",
                  "columnWidths": [
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        5494,
        5494
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[y= 3x + 1\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "layout",
                  "columnWidths": [
                    567,
                    567,
                    567,
                    567,
                    567,
                    567,
                    567,
                    567
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Побудуйте графік функції:",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "graphPaper",
                  "columnWidths": [
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[y= 0,25x + 1\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "layout",
                  "columnWidths": [
                    567,
                    567,
                    567,
                    567,
                    567,
                    567,
                    567,
                    567
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Побудуйте графік функції:",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "graphPaper",
                  "columnWidths": [
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        5494,
        5494
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[y=x - 5\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "layout",
                  "columnWidths": [
                    390,
                    516,
                    596,
                    516,
                    596,
                    516,
                    596,
                    336
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-3"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-2,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-2"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-1,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-1"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "-0,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "0"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "0,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "1"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "1,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "2"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "2,5"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "3"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Побудуйте графік функції:",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "graphPaper",
                  "columnWidths": [
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[y= \\frac{1}{6}x-5;\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "layout",
                  "columnWidths": [
                    567,
                    567,
                    567,
                    567,
                    567,
                    567,
                    567,
                    567
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "X",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "subheading",
                              "align": "center",
                              "runs": [
                                {
                                  "text": "Y",
                                  "bold": true
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Побудуйте графік функції:",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "graphPaper",
                  "columnWidths": [
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284,
                    284
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        },
                        {
                          "blocks": []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "algebra-7": [
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "6. "
        },
        {
          "text": "Математичні вирази"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Ч"
        },
        {
          "text": "исловим виразом називають "
        },
        {
          "text": "будь-який запис із чисел, знаків арифметичних дій і дужок"
        },
        {
          "text": ", що має математичний сенс."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Математичний вираз – це",
          "bold": true
        },
        {
          "text": " фраза, записана за допомогою чисел, знаків і букв. Вираз, записаний тільки за допомогою чисел і знаків, називається числовим."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Наприклад: "
        },
        {
          "text": "\\(3 + 5\\)",
          "math": true
        },
        {
          "text": " "
        },
        {
          "text": "⋅"
        },
        {
          "text": "безглуздий набір символів",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Буквений вираз",
          "bold": true
        },
        {
          "text": " – це математичний вираз, що містить не тільки числа й знаки дій, а й "
        },
        {
          "text": "букви",
          "italic": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Оскільки букви можна заміняти довільними числами, то ці букви називають "
        },
        {
          "text": "змінними",
          "bold": true
        },
        {
          "text": ", а сам буквений вираз — "
        },
        {
          "text": "виразом зі змінними",
          "bold": true
        },
        {
          "text": " (або зі змінною, якщо вона одна)."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Змінна",
          "bold": true
        },
        {
          "text": " — "
        },
        {
          "text": "математична величина, значення якої може змінюватись у межах певної задачі"
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Числові вирази та вирази зі змінними називають "
        },
        {
          "text": "алгебраїчними виразами.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Вирази, що не містять ділення на вирази зі змінними, називаються "
        },
        {
          "text": "цілими виразами.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Запис, сполучений знаком рівності, називається "
        },
        {
          "text": "числовою рівністю.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Вирази, відповідні значення яких є рівними при будь-яких значеннях змінних, що входять до них, називають "
        },
        {
          "text": "тотожно рівними",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Рівність, яка є правильною при будь-яких значеннях змінних, що входять до неї, називають тотожністю"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Заміну одного виразу іншим, тотожно рівним йому, називають"
        },
        {
          "text": " тотожним перетворенням виразу",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Зведення подібних доданків і розкриття дужок — приклади тотожних перетворень виразів."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Спрощення виразу - це заміна його простішим (для вирішення, для сприйняття), тотожно рівним даному."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Методи тотожних перетворень: 1. ",
          "bold": true
        },
        {
          "text": "Розкрити дужки. 2. Звести подібні доданки. 3. Додати до лівої та правої частин рівності одне й те саме число. 4. Помножити або поділити ліву й праву частини"
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "рівності на одне й те саме число (за винятком нуля). 5. Перенести один із доданків через знак = (з лівої частини рівності до правої або з правої до лівої)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Приклади ",
          "bold": true
        },
        {
          "text": "тотожніх",
          "bold": true
        },
        {
          "text": " перетворень",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2802,
        4677,
        3119
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Первинне значення",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Дія",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Результат",
                      "bold": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a -15 = 0\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Додамо"
                    },
                    {
                      "text": " до обох частин рівняння 15"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a = 15\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a = 5\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Помножимо обидві частини рівняння на -1"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(-a = -5\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[\\frac{a}{5}=1\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Помножимо обидві частини рівняння на 5"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a= 5\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(3(a+5)=1\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Розкриємо дужки"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(3a+15 = 1\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Приклад розкриття дужок та зведення доданків",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2802,
        4677,
        3119
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Первинне значення",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Дія",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Результат",
                      "bold": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\((a+2)(a+3)=0\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{2}+3a+2a+6 = 0\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Перемножимо всі складові дужок по черзі"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Зведемо подібні доданки"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{2}+3a+2a+6 = 0\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{2}+5a+6 = 0\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розкриття дужок.",
          "bold": true
        },
        {
          "text": " Щоб помножити одночлен на многочлен, треба помножити цей одночлен на кожний член многочлена й додати знайдені добутки. Множення одночлена на многочлен"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "\\[5x(3x-7)=5x\\cdot3x-5x\\cdot7=15x^2-35x\\]",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розкласти многочлен на множники означає подати його у вигляді добутку одночлена на многочлен або добутку кількох многочленів так, щоб цей добуток був тотожно рівним даному многочлену."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розкладання многочленів на множники способом винесення спільного множника за дужки",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "\\[8m+4=4\\cdot2m+4\\cdot1=4(2m+1)\\]",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "\\[at+7ap=a(t+7p)\\]",
          "math": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        5494,
        5494
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Множення многочлена на многочлен"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[(a+b)(x+y)=(a+b)m=am+bm\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[(a+b)(x+y)=ax+ay+bx+by\\]",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Щоб помножити многочлен на многочлен, треба кожний член одного многочлена "
        },
        {
          "text": ""
        },
        {
          "text": " "
        },
        {
          "text": "помножити"
        },
        {
          "text": " на кожний член другого многочлена й "
        },
        {
          "text": "одержані"
        },
        {
          "text": " добутки додати."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розкладання многочленів на множники способом групування",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "\\[ab-5a+2b-10\\]",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "\\[(ab-5a)+(2b-10)=a(b-5)+2(b-5)\\]",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "\\[a\\underline{(b-5)}+2\\underline{(b-5)}=(b-5)(a+2)\\]",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "1) розбити многочлен на групи доданків, кожна з яких містить спільний множник; "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "2) з кожної групи винести спільний множник за дужки; "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "3) спільний для всіх груп множник, що утворився, винести за дужки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "8. "
        },
        {
          "text": "Рівняння"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Рівняння — це",
          "bold": true
        },
        {
          "text": " рівність, що містить позначене буквою невідоме число, яке потрібно знайти"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Рівняння виду "
        },
        {
          "text": "\\(ax= b\\)",
          "math": true
        },
        {
          "text": ", де x — змінна, a і b — деякі числа, "
        },
        {
          "text": "називають лінійним рівнянням з однією змінною",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розв’язання лінійних рівнянь:",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розв’яжемо рівняння "
        },
        {
          "text": "\\(ax= b\\)",
          "math": true
        },
        {
          "text": " для різних значень a і b."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "\\(x=\\frac{b}{a}\\)",
          "math": true
        },
        {
          "text": "\n"
        },
        {
          "text": "\\(\\frac{b}{a}\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2747,
        2747,
        2747,
        2747
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Значення a і b",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": []
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a = 0, b = 0\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": []
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Корені рівняння "
                    },
                    {
                      "text": "\\(ax= b\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": []
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "x — будь-яке число"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Коренів немає"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Алгоритм вирішення рівнянь",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2802,
        4677,
        3119
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Первинне значення",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Дія",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Результат",
                      "bold": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(3(a+2)-2(3a-6)=14+a\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Розкриємо дужки"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(3a+6-6a+12=18+a\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(3a+6-6a+12=14+a\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Зведемо подібні доданки"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(-3a+18=14+a\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(-3a+18=14+a\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Перенесемо/залишимо всі елементи з "
                    },
                    {
                      "text": "a",
                      "bold": true
                    },
                    {
                      "text": " зліва від знаку =, а без "
                    },
                    {
                      "text": "а",
                      "bold": true
                    },
                    {
                      "text": " – справа"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(-4a=-4\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(-4a=-4\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Ділимо обидві частини на значення (коефіцієнт, що стоїть при а) -4"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a=1\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(3(a+2)-2(3a-6)=14+a\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Підставляємо знайдене значення "
                    },
                    {
                      "text": "\\(a=1\\)",
                      "math": true
                    },
                    {
                      "text": " до первинного рівняння (для перевірки)"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(3(1+2)-2(3-6)=14+1\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(9+6=15 15=15\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "12. "
        },
        {
          "text": "Текстові задачі:"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Рівняння, складене за умовою реальної ситуації, називають "
        },
        {
          "text": "математичною моделлю",
          "bold": true
        },
        {
          "text": " даної ситуації. "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Алгоритмом розв’язування задач",
          "bold": true
        },
        {
          "text": " – це послідовність дій, які необхідно виконати для вирішення задачі."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Алгоритм розв’язання задач на складання рівняння: "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "1) за умовою задачі скласти рівняння (побудувати математичну модель задачі); "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "2) розв’язати отримане рівняння; "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "3) з’ясувати, чи відповідає знайдений корінь змісту задачі, і дати відповідь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Алгоритм складання ",
          "bold": true
        },
        {
          "text": "рівняння",
          "bold": true
        },
        {
          "text": ":",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "1. Що є невідомим (що є x)? 2. Виразіть "
        },
        {
          "text": "через"
        },
        {
          "text": " x усі елементи, описані в задачі. 3. Запишіть рівняння, що відображає співвідношення елементів."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "10. Ступені та корені"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Степенем числа "
        },
        {
          "text": "а",
          "bold": true
        },
        {
          "text": " з натуральним показником "
        },
        {
          "text": "\\(n (n > 1)\\)",
          "math": true
        },
        {
          "text": " називають добуток n множників, кожний з яких дорівнює а. "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "\\[\\underbrace{4\\cdot4\\cdot4\\cdot4\\cdot4\\cdot4}_{6\\text{ множників}}=4^6\\]",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Степінь з основою а і показником n записують так: "
        },
        {
          "text": "а"
        },
        {
          "text": "n",
          "superscript": true
        },
        {
          "text": ", читають: «а в степені n» або «n-й степінь числа а»"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "a",
          "bold": true
        },
        {
          "text": "2",
          "bold": true,
          "superscript": true
        },
        {
          "text": " називають квадратом числа а, "
        },
        {
          "text": "а",
          "bold": true
        },
        {
          "text": "3",
          "bold": true,
          "superscript": true
        },
        {
          "text": " називають кубом числа а."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Властивості ",
          "bold": true
        },
        {
          "text": "ступеня",
          "bold": true
        },
        {
          "text": ".",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2197,
        2197,
        2198,
        2198,
        2198
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{n}a^{m}= a^{n+m}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{n}a^{m}a^{k}= a^{n+m+k}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{n}:a^{m}= a^{(n-m)}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\((a^{n})^{m}= a^{nm}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\((ab)^{n}=a^{n}b^{n}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{2}a^{3}= a^{(2+3)}= a^{5}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{2}a^{3}a^{5}= a^{(2+3+5)}= a^{10}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a^{5}: a^{3}= a^{(5-3)}= a^{2}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\((a^{5})^{2}= a^{(2\\cdot{}5)}=a^{10}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\((ab)^{3}=a^{3}b^{3}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Вирази, що є добутком чисел, змінних та їхніх степенів, називають "
        },
        {
          "text": "одночленами.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Вигляд одночлена, який містить тільки один числовий множник, відмінний від нуля, що стоїть на першому місці, називають "
        },
        {
          "text": "стандартним виглядом одночлена.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Числовий множник одночлена, записаного в стандартному вигляді, називають "
        },
        {
          "text": "коефіцієнтом одночлена",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Одночлени, в яких буквені частини є тотожно рівними виразами, називають "
        },
        {
          "text": "подібними",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Степенем одночлена",
          "bold": true
        },
        {
          "text": " називають суму показників степенів усіх змінних, що входять до нього."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": " Степінь одночлена, який є числом, відмінним від нуля, вважають рівним нулю."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Вираз, який є сумою кількох одночленів, називають многочленом."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Якщо серед одночленів, з яких складається многочлен, є подібні, то їх називають подібними членами многочлена."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Многочлен, складений з одночленів стандартного вигляду, серед яких немає подібних, називають многочленом стандартного вигляду"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Степенем многочлена стандартного вигляду називають найбільший зі степенів одночленів, з яких цей многочлен складений."
        }
      ]
    }
  ],
  "algebra-8-complex": [
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "6. Математичні вирази"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Порядок дій",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        10768
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Дії в алгебраїчних виразах мають такі послідовності:",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Дужки",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Ступені та корені",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Множення та ділення",
                      "bold": true
                    },
                    {
                      "text": " - виконуються "
                    },
                    {
                      "text": "зліва направо",
                      "bold": true
                    },
                    {
                      "text": " у тому порядку, як стоять у виразі."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Додавання та віднімання",
                      "bold": true
                    },
                    {
                      "text": " - виконуються "
                    },
                    {
                      "text": "зліва направо",
                      "bold": true
                    },
                    {
                      "text": " у тому порядку, як стоять у виразі."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "2. Арифметичні дії"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Робота із від’ємними числами",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        5381,
        5381
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "1. Додавання від’ємних чисел",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо додаємо два від’ємних числа – результат від’ємний, сума абсолютних значень.",
                      "italic": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(-4+(-5)=-9\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо додаємо від’ємне до додатного",
                      "bold": true
                    },
                    {
                      "text": ", то:"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "додатне більше",
                      "bold": true
                    },
                    {
                      "text": ", результат додатний. "
                    },
                    {
                      "text": "\\(7+(-3)=4\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "від’ємне більше",
                      "bold": true
                    },
                    {
                      "text": ", результат від’ємний. "
                    },
                    {
                      "text": "\\(-6+2=-4\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "2. Віднімання від’ємних чисел",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Віднімання від’ємного числа",
                      "bold": true
                    },
                    {
                      "text": " = "
                    },
                    {
                      "text": "додавання його протилежного",
                      "bold": true
                    },
                    {
                      "text": " (мінус на мінус — дає плюс)."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(5-(-2)=5+2=7\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Загальне правило:",
                      "bold": true
                    },
                    {
                      "text": "\n"
                    },
                    {
                      "text": "\\(a-(-b)=a+b\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a-(+b)=a-b\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "3. Множення чисел з різними знаками",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "grid",
                  "columnWidths": [
                    1413,
                    1417,
                    1418
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "×"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Додатне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Від’ємне"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Додатне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Додатне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Від’ємне"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Від’ємне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Від’ємне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Додатне"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(-3\\times{}4=-12-3\\times{}-4=12\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "4. Ділення чисел з різними знаками",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "table",
                  "variant": "grid",
                  "columnWidths": [
                    1413,
                    1417,
                    1418
                  ],
                  "rows": [
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "÷"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Додатне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Від’ємне"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Додатне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Додатне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Від’ємне"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "cells": [
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Від’ємне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Від’ємне"
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "blocks": [
                            {
                              "type": "paragraph",
                              "variant": "body",
                              "align": "left",
                              "runs": [
                                {
                                  "text": "Додатне"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(-12\\div{}3=-4-12\\div{}-3=4\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "5. Ступені з від’ємними числами",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\((-2)^{2}=(-2)\\times{}(-2)=4\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\(-2^{2}=-(2^{2})=-4\\)",
                      "math": true
                    }
                  ]
                }
              ],
              "colSpan": 2
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "6. Математичні вирази"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Еквівалентні перетворення",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        4957,
        5805
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "1. Додавання або віднімання однакових виразів з обох частин рівняння",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(x+3=7\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(x=4\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "2. Множення або ділення обох частин на одне й те саме (ненульове!) число",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(3x=12\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Поділимо обидві частини на 3:"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(x=4\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "3. "
                    },
                    {
                      "text": "Розкриття дужок",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Можна розкривати дужки, використовуючи дистрибутивну властивість:"
                    },
                    {
                      "text": "\n"
                    },
                    {
                      "text": "\\(a(b+c)=ab+ac\\)",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(2(x+3)=142x+6=14\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "4. "
                    },
                    {
                      "text": "Перенесення членів з однієї частини рівняння в іншу зі зміною ",
                      "bold": true
                    },
                    {
                      "text": "знака",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "це теж додавання/віднімання, просто в скороченій формі."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(x+5=8\\)",
                      "math": true
                    },
                    {
                      "text": "Переносимо"
                    },
                    {
                      "text": " 5 в праву частину зі знаком «–»:"
                    },
                    {
                      "text": "\n"
                    },
                    {
                      "text": "\\(x=8-5=3\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "5. "
                    },
                    {
                      "text": "Заміна виразу рівним йому",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Будь-який вираз у рівнянні можна замінити на "
                    },
                    {
                      "text": "інший рівний вираз",
                      "bold": true
                    },
                    {
                      "text": "."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\(x+x=10\\)",
                      "math": true
                    },
                    {
                      "text": "Можна записати як "
                    },
                    {
                      "text": "\\(2x=10\\)",
                      "math": true
                    }
                  ]
                }
              ],
              "colSpan": 2
            }
          ]
        }
      ]
    }
  ],
  "algebra-8-fractions": [
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "5. "
        },
        {
          "text": "Дроби"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Дробові ",
          "bold": true
        },
        {
          "text": "вирази - ",
          "bold": true
        },
        {
          "text": "містять ділення на вираз зі змінними."
        },
        {
          "text": " "
        },
        {
          "text": "Допустим",
          "bold": true
        },
        {
          "text": "і значеннями змінних",
          "bold": true
        },
        {
          "text": " - такі, "
        },
        {
          "text": "при яких цей вираз має зміст."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Цілі та дробові вирази",
          "bold": true
        },
        {
          "text": " називають "
        },
        {
          "text": "раціональними виразами",
          "bold": true
        },
        {
          "text": ". Якщо в "
        },
        {
          "text": "раціональному виразі",
          "bold": true
        },
        {
          "text": " замінити змінні числами, то отримаємо "
        },
        {
          "text": "числовий вираз",
          "bold": true
        },
        {
          "text": ". Проте ця заміна можлива лише тоді, коли вона "
        },
        {
          "text": "не приводить до ділення на нуль",
          "bold": true
        },
        {
          "text": "."
        },
        {
          "text": " "
        },
        {
          "text": "Р",
          "bold": true
        },
        {
          "text": "аціональний дріб",
          "bold": true
        },
        {
          "text": " - ц"
        },
        {
          "text": "е дріб, чисельником і знаменником якого є многочлени"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Вирази, відповідні значення яких рівні "
        },
        {
          "text": "при будь-яких допустимих значеннях змінних",
          "bold": true
        },
        {
          "text": ", що в них входять, називають "
        },
        {
          "text": "тотожно рівними",
          "bold": true
        },
        {
          "text": "."
        },
        {
          "text": " "
        },
        {
          "text": "Рівність, яка виконується при будь-яких допустимих значеннях змінних, що в неї входять, називають "
        },
        {
          "text": "тотожністю",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "table",
      "variant": "layout",
      "columnWidths": [
        1800,
        1418,
        1134,
        2844,
        3792
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[\\frac{a}{b}=\\frac{am}{bm}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "a,b,m — деякі числа, "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(b \\ne{} 0\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "\\(m \\ne{} 0\\)",
                      "math": true
                    }
                  ]
                }
              ],
              "colSpan": 2
            },
            {
              "blocks": [],
              "colSpan": 2
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо чисельник і знаменник раціонального дробу помножити на один і той самий ненульовий многочлен, то отримаємо дріб, тотожно рівний даному, "
                    },
                    {
                      "text": "ця"
                    },
                    {
                      "text": " властивість називають "
                    },
                    {
                      "text": "основною властивістю раціонального дробу",
                      "bold": true
                    },
                    {
                      "text": " й записують:"
                    }
                  ]
                }
              ],
              "colSpan": 4
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[\\frac{A}{B}=\\frac{A\\cdot C}{B\\cdot C}\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "де A, B і C — многочлени, причому многочлени B і C ненульові."
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[\\frac{A\\cdot C}{B\\cdot C}= \\frac{A}{B}\\]",
                      "math": true
                    }
                  ]
                }
              ],
              "colSpan": 2
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Таке тотожне перетворення називають скороченням дробу на множник C."
                    }
                  ]
                }
              ],
              "colSpan": 3
            }
          ]
        }
      ]
    },
    {
      "type": "table",
      "variant": "layout",
      "columnWidths": [
        8330,
        2658
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Щоб додати раціональні дроби з однаковими знаменниками, треба додати їхні чисельники, а знаменник залишити той самий."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[\\frac{a}{c}+\\frac{b}{c}=\\frac{a+b}{c}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "table",
      "variant": "layout",
      "columnWidths": [
        2802,
        8186
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[\\frac{a}{c}-\\frac{b}{c}=\\frac{a-b}{c}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Щоб відняти раціональні дроби з однаковими знаменниками, треба від чисельника першого дробу відняти чисельник другого дробу, а знаменник залишити той самий."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "table",
      "variant": "layout",
      "columnWidths": [
        6062,
        4926
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Для складання дробів із різним знаменником за"
                    },
                    {
                      "text": " спільний знаменник вибрано вираз, який дорівнює "
                    },
                    {
                      "text": "добутку знаменників даних дробів",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[\\frac{A}{B}+\\frac{C}{D}=\\frac{A\\cdot D}{B\\cdot D}+\\frac{C\\cdot B}{D\\cdot B}=\\frac{A\\cdot D+C\\cdot B}{B\\cdot D}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "table",
      "variant": "layout",
      "columnWidths": [
        2093,
        8895
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[\\frac{a}{b}\\cdot \\frac{c}{d}=\\frac{ac}{bd}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Добутком двох раціональних дробів",
                      "bold": true
                    },
                    {
                      "text": " є раціональний дріб, чисельник якого дорівнює добутку чисельників даних дробів, а знаменник — добутку їхніх знаменників."
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[\\frac{a}{b}:\\frac{c}{d}=\\frac{ad}{bc}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Часткою двох раціональних дробів",
                      "bold": true
                    },
                    {
                      "text": " є раціональний дріб, чисельник якого дорівнює добутку чисельника діленого та знаменника дільника, а знаменник — добутку знаменника діленого та чисельника дільника."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Піднесення дробу до ступеня",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        1242,
        9746
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[\\left(\\frac{A}{B}\\right)^n=\\frac{A^n}{B^n}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Щоб піднести раціональний дріб до степеня, треба піднести до цього степеня чисельник і знаменник. Перший результат записати як чисельник, а другий — як знаменник дробу."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "8. Рівняння"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Рівносильні рівняння",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Два рівняння називають "
        },
        {
          "text": "рівносильними",
          "bold": true
        },
        {
          "text": ", якщо вони мають одні й ті самі корені або кожне з рівнянь не має коренів."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Дії, у результаті яких отримують рівняння, рівносильне даному:"
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        6912,
        4076
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Д"
                    },
                    {
                      "text": "о обох частин даного рівняння "
                    },
                    {
                      "text": "додати",
                      "bold": true
                    },
                    {
                      "text": " (або відняти) одне й те сам"
                    },
                    {
                      "text": "е число, то отримаємо рівняння"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[2a+c=0\\Leftrightarrow 2a+c+d=d\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[2a+c=0\\Leftrightarrow 2a+c-2e=-2e\\]",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Який-небудь доданок перенести з однієї частини рівняння в другу, змінивши його "
                    },
                    {
                      "text": "знак на протилежний",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[2a+c=0\\Leftrightarrow 2a=-c\\]",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Обидві частини рівняння "
                    },
                    {
                      "text": "помножити (поділити) на одне й те саме відмінне від нуля число",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\[2a+c=0\\Leftrightarrow 4a+2c=0\\]",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "10. Ступені та корені"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Піднесення до ступеня",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2660,
        2661,
        2555,
        2392
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[{a}^{m}\\cdot {a}^{n}={a}^{m+n}\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[{({a}^{m})}^{n}={a}^{mn}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[{(ab)}^{n}={a}^{n}\\cdot {b}^{n}\\]",
                      "math": true
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[{a}^{m}:{a}^{n}={a}^{m-n}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[{a}^{-n}=\\frac{1}{{a}^{n}}\\]",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "\\[\\sqrt{a}=b, {b}^{2}=a\\]",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Корені",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Квадратним коренем",
          "bold": true
        },
        {
          "text": " із числа "
        },
        {
          "text": "a",
          "bold": true
        },
        {
          "text": " називають число, квадрат якого дорівнює "
        },
        {
          "text": "a",
          "bold": true
        },
        {
          "text": ";      ",
          "bold": true
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "\\(\\sqrt{a}=b, a= {b}^{2}\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Арифметичним",
          "bold": true
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "квадратним",
          "bold": true
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "коренем",
          "bold": true
        },
        {
          "text": " "
        },
        {
          "text": "із"
        },
        {
          "text": " числа a "
        },
        {
          "text": "називають"
        },
        {
          "text": " "
        },
        {
          "text": "невід’ємне",
          "bold": true
        },
        {
          "text": " число, квадрат "
        },
        {
          "text": "якого"
        },
        {
          "text": " "
        },
        {
          "text": "дорівнює"
        },
        {
          "text": " "
        },
        {
          "text": "a",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Вираз"
        },
        {
          "text": ","
        },
        {
          "text": " "
        },
        {
          "text": "який"
        },
        {
          "text": " "
        },
        {
          "text": "стоїть"
        },
        {
          "text": " "
        },
        {
          "text": "під"
        },
        {
          "text": " радикалом, "
        },
        {
          "text": "називають"
        },
        {
          "text": " "
        },
        {
          "text": "підкореневим",
          "bold": true
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "виразом",
          "bold": true
        },
        {
          "text": ".",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Дію"
        },
        {
          "text": " "
        },
        {
          "text": "знаходження"
        },
        {
          "text": " "
        },
        {
          "text": "арифметичного"
        },
        {
          "text": " квадратного "
        },
        {
          "text": "кореня"
        },
        {
          "text": " "
        },
        {
          "text": "із"
        },
        {
          "text": " числа "
        },
        {
          "text": "називають"
        },
        {
          "text": " "
        },
        {
          "text": "добуванням",
          "bold": true
        },
        {
          "text": " квадратного ",
          "bold": true
        },
        {
          "text": "кореня",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Для будь-"
        },
        {
          "text": "якого"
        },
        {
          "text": " "
        },
        {
          "text": "дійсного"
        },
        {
          "text": " числа а "
        },
        {
          "text": "виконується"
        },
        {
          "text": " "
        },
        {
          "text": "рівність"
        },
        {
          "text": " "
        },
        {
          "text": "\\(\\sqrt{{a}^{2}}=\\left|a\\right|\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Для будь-"
        },
        {
          "text": "якого"
        },
        {
          "text": " "
        },
        {
          "text": "дійсного"
        },
        {
          "text": " числа а та будь-"
        },
        {
          "text": "якого"
        },
        {
          "text": " "
        },
        {
          "text": "нату"
        },
        {
          "text": " "
        },
        {
          "text": "рального"
        },
        {
          "text": " числа n "
        },
        {
          "text": "виконується"
        },
        {
          "text": " "
        },
        {
          "text": "рівність"
        },
        {
          "text": " "
        },
        {
          "text": "\\(\\sqrt{{a}^{2n}}=\\left|{a}^{n}\\right|\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Для будь-"
        },
        {
          "text": "яких"
        },
        {
          "text": " "
        },
        {
          "text": "дійсних"
        },
        {
          "text": " чисел а і b таких, "
        },
        {
          "text": "що"
        },
        {
          "text": " "
        },
        {
          "text": "\\(a \\ge{} 0\\)",
          "math": true
        },
        {
          "text": " і "
        },
        {
          "text": "\\(b \\ge{} 0\\)",
          "math": true
        },
        {
          "text": ", "
        },
        {
          "text": "виконується"
        },
        {
          "text": " "
        },
        {
          "text": "рівність"
        },
        {
          "text": " "
        },
        {
          "text": "\\(\\sqrt{ab}=\\sqrt{a }\\cdot \\sqrt{b}\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "\\(\\sqrt{abc}=\\sqrt{(ab)c}=\\sqrt{ab }\\cdot \\sqrt{c}=\\sqrt{a }\\cdot \\sqrt{b}\\cdot \\sqrt{c}\\)",
          "math": true
        },
        {
          "text": "         "
        },
        {
          "text": "\\(\\sqrt{\\frac{a}{b} }=\\frac{\\sqrt{a}}{\\sqrt{b}}\\)",
          "math": true
        }
      ]
    }
  ],
  "algebra-9": [
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "4. Рівності та нерівності"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Число "
        },
        {
          "text": "a",
          "bold": true
        },
        {
          "text": " вважають більшим за число "
        },
        {
          "text": "b",
          "bold": true
        },
        {
          "text": ", якщо різниця "
        },
        {
          "text": "a – b",
          "bold": true
        },
        {
          "text": " є "
        },
        {
          "text": "додатним",
          "bold": true
        },
        {
          "text": " числом. "
        },
        {
          "text": "\\(a>b, a-b>0\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Число "
        },
        {
          "text": "a",
          "bold": true
        },
        {
          "text": " вважають меншим від числа "
        },
        {
          "text": "b",
          "bold": true
        },
        {
          "text": ", якщо різниця "
        },
        {
          "text": "a – b",
          "bold": true
        },
        {
          "text": " є від’ємним числом."
        },
        {
          "text": " "
        },
        {
          "text": "\\(a<b, a-b<0\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Основні властивості числових нерівностей",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2093,
        3544,
        5351
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(a>b\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "\\(b>c\\)",
                      "math": true
                    },
                    {
                      "text": ", "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "то "
                    },
                    {
                      "text": "\\(a>c\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(a>b\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "c",
                      "bold": true
                    },
                    {
                      "text": " — будь-яке число, "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "то "
                    },
                    {
                      "text": "\\(a + c>b + c\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(a>b\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "c",
                      "bold": true
                    },
                    {
                      "text": " — додатне число, то "
                    },
                    {
                      "text": "\\(ac>bc\\)",
                      "math": true
                    },
                    {
                      "text": ". "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(a>b\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "c",
                      "bold": true
                    },
                    {
                      "text": " — від'ємне число, то "
                    },
                    {
                      "text": "\\(ac<bc\\)",
                      "math": true
                    },
                    {
                      "text": "."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        1951,
        2126,
        6911
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(ab>0\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "\\(a>b\\)",
                      "math": true
                    },
                    {
                      "text": ", "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "то  "
                    },
                    {
                      "text": "\\(\\frac{1}{a}<\\frac{1}{b}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(a>b\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "\\(c>d\\)",
                      "math": true
                    },
                    {
                      "text": ", "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "то "
                    },
                    {
                      "text": "\\(a + c > b + d\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(a>b,c>d\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "a, b, c, d",
                      "bold": true
                    },
                    {
                      "text": " — додатні числа, "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "то "
                    },
                    {
                      "text": "\\(ac>bd\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        10988
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(a>b\\)",
                      "math": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "a, b",
                      "bold": true
                    },
                    {
                      "text": " — додатні числа, то "
                    },
                    {
                      "text": "\\(a^{n}>b^{n}\\)",
                      "math": true
                    },
                    {
                      "text": ", де "
                    },
                    {
                      "text": "n",
                      "bold": true
                    },
                    {
                      "text": " — натуральне число"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Розв’язки нерівності",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розв’язком нерівності з однією змінною називають значення змінної, яке перетворює її в правильну числову нерівність."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розв’язати нерівність означає знайти всі її розв’язки або довести, що розв’язків не існує."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розв’язати нерівність означає знайти множину її розв’язків."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Нерівності",
          "bold": true
        },
        {
          "text": " називають "
        },
        {
          "text": "рівносильними",
          "bold": true
        },
        {
          "text": ", якщо вони мають одну й ту саму множину розв’язків."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Нерівності, проміжки за зображення",
          "bold": true
        }
      ]
    },
    {
      "type": "image",
      "src": "/materials/source/algebra-9/01-image1.png",
      "alt": "Ілюстрація 1 до матеріалу «Алгебра 9 клас»"
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Множина допустимих значень змінної x",
          "bold": true
        },
        {
          "text": ", тобто всі значення змінної x, при яких даний вираз "
        },
        {
          "text": "має зміст",
          "bold": true
        },
        {
          "text": ". Цю множину називають "
        },
        {
          "text": "областю визначення виразу",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розв’язком системи нерівностей з однією змінною називають значення змінної, яке "
        },
        {
          "text": "перетворює кожну нерівність системи",
          "bold": true
        },
        {
          "text": " "
        },
        {
          "text": "в правильну числову нерівність",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розв’язати систему нерівностей означає "
        },
        {
          "text": "знайти всі її розв’язки",
          "bold": true
        },
        {
          "text": " або довести, що "
        },
        {
          "text": "розв’язків немає",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Розв’язки системи нерівностей утворюють множину розв’язків системи нерівностей"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "14. "
        },
        {
          "text": "Функці"
        },
        {
          "text": "ї"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": " Нехай "
        },
        {
          "text": "X",
          "bold": true
        },
        {
          "text": " — множина значень незалежної змінної, "
        },
        {
          "text": "Y",
          "bold": true
        },
        {
          "text": " — множина значень залежної змінної. "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Функція",
          "bold": true
        },
        {
          "text": " — "
        },
        {
          "text": "це правило",
          "bold": true
        },
        {
          "text": ", за допомогою якого за кожним значенням незалежної змінної з множини X можна знайти єдине значення залежної змінної з множини Y. "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Нуль функції",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Значення аргументу, при якому значення функції дорівнює нулю, називають "
        },
        {
          "text": "нулем функції",
          "bold": true
        },
        {
          "text": ". "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Проміжок ",
          "bold": true
        },
        {
          "text": "знакосталості",
          "bold": true
        },
        {
          "text": " функції",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Проміжок, на якому функція набуває значень однакового "
        },
        {
          "text": "знака"
        },
        {
          "text": ", називають "
        },
        {
          "text": "проміжком ",
          "bold": true
        },
        {
          "text": "знакосталості",
          "bold": true
        },
        {
          "text": " функції",
          "bold": true
        },
        {
          "text": ". "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Зростання і спадання функції",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Функцію називають "
        },
        {
          "text": "зростаючою",
          "bold": true
        },
        {
          "text": " на деякому проміжку, якщо для будь-яких значень аргументу із цього проміжку "
        },
        {
          "text": "більшому значенню аргументу",
          "bold": true
        },
        {
          "text": " відповідає "
        },
        {
          "text": "більше значення функції",
          "bold": true
        },
        {
          "text": ". Функцію називають "
        },
        {
          "text": "спадною",
          "bold": true
        },
        {
          "text": " на деякому проміжку, якщо для будь-яких "
        },
        {
          "text": "значень аргументу",
          "bold": true
        },
        {
          "text": " із цього проміжку більшому значенню аргументу відповідає "
        },
        {
          "text": "менше значення функції",
          "bold": true
        },
        {
          "text": ". "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Побудова графіка функції ",
          "bold": true
        },
        {
          "text": "\\(y =kf(x)\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Графік функції "
        },
        {
          "text": "\\(y =kf(x)\\)",
          "math": true
        },
        {
          "text": " можна отримати з графіка функції "
        },
        {
          "text": "\\(y = f (x)y\\)",
          "math": true
        },
        {
          "text": " результаті розтягнення в "
        },
        {
          "text": "k",
          "bold": true
        },
        {
          "text": " разів від осі абсцис, якщо "
        },
        {
          "text": "\\(k>1\\)",
          "math": true
        },
        {
          "text": ", або в результаті стискання в"
        },
        {
          "text": " k раз"
        },
        {
          "text": "ів"
        },
        {
          "text": " до осі абсцис, якщо "
        },
        {
          "text": "\\(k>1\\)",
          "math": true
        },
        {
          "text": ", або в результаті стискання в "
        },
        {
          "text": "\\(\\frac{1}{k}\\)",
          "math": true
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "раза"
        },
        {
          "text": " до осі абсцис, якщо "
        },
        {
          "text": "\\(0<k<1\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Побудова графіка функції ",
          "bold": true
        },
        {
          "text": "\\(y = f (x) + b\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Графік функції "
        },
        {
          "text": "\\(y = f (x) + b\\)",
          "math": true
        },
        {
          "text": " можна отримати в результаті паралельного перенесення графіка функції "
        },
        {
          "text": "\\(y = f (x)y\\)",
          "math": true
        },
        {
          "text": "вздовж осі ординат на "
        },
        {
          "text": "b",
          "bold": true
        },
        {
          "text": " одиниць угору, якщо "
        },
        {
          "text": "\\(b>0\\)",
          "math": true
        },
        {
          "text": ", і на "
        },
        {
          "text": "–b",
          "bold": true
        },
        {
          "text": " одиниць униз, якщо "
        },
        {
          "text": "\\(b<0\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Побудова графіка функції ",
          "bold": true
        },
        {
          "text": "\\(y = f (x + a)\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": " Графік функції "
        },
        {
          "text": "\\(y = f (x + a)\\)",
          "math": true
        },
        {
          "text": " можна отримати в результаті паралельного перенесення графіка функції "
        },
        {
          "text": "\\(y = f (x)y\\)",
          "math": true
        },
        {
          "text": "вздовж осі абсцис на a одиниць уліво, якщо "
        },
        {
          "text": "\\(a>0\\)",
          "math": true
        },
        {
          "text": ", і на "
        },
        {
          "text": "–a",
          "bold": true
        },
        {
          "text": " одиниць управо, якщо "
        },
        {
          "text": "\\(a<0\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Квадратична функція",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Функцію, яку можна задати формулою виду "
        },
        {
          "text": "\\(y = ax^{2}+bx+ c\\)",
          "math": true
        },
        {
          "text": ", де "
        },
        {
          "text": "x",
          "bold": true
        },
        {
          "text": " — незалежна змінна, "
        },
        {
          "text": "a, b",
          "bold": true
        },
        {
          "text": " і "
        },
        {
          "text": "c",
          "bold": true
        },
        {
          "text": " — деякі числа, причому "
        },
        {
          "text": "\\(a \\ne{} 0\\)",
          "math": true
        },
        {
          "text": ", називають квадратичною."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Квадратні нерівності",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": " Нерівності виду "
        },
        {
          "text": "\\(ax^{2}+bx+ c>0,ax^{2}+bx+ c <0,ax^{2}+bx+c\\ge{}0,ax^{2}+bx+c\\le{}0\\)",
          "math": true
        },
        {
          "text": ", де "
        },
        {
          "text": "x",
          "bold": true
        },
        {
          "text": " — змінна, "
        },
        {
          "text": "a, b",
          "bold": true
        },
        {
          "text": " і "
        },
        {
          "text": "c",
          "bold": true
        },
        {
          "text": " — деякі числа, причому "
        },
        {
          "text": "\\(a \\ne{} 0\\)",
          "math": true
        },
        {
          "text": ", називають квадратними."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Схематичне розміщення параболи "
        },
        {
          "text": "\\(y = ax^{2}+bx+ c\\)",
          "math": true
        },
        {
          "text": " відносно осі абсцис"
        }
      ]
    },
    {
      "type": "image",
      "src": "/materials/source/algebra-9/02-image2.png",
      "alt": "Ілюстрація 2 до матеріалу «Алгебра 9 клас»"
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "left",
      "runs": [
        {
          "text": "21. Комбінаторика. Прогресії"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Послідовність",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Об’єкти, які пронумеровано поспіль натуральними числами "
        },
        {
          "text": "1, 2, 3, ..., n,",
          "bold": true
        },
        {
          "text": " ..., утворюють послідовності. "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Арифметична прогресія",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Послідовність, кожний член якої, починаючи з другого, дорівнює попередньому члену, до якого додано одне й те саме число, називають арифметичною прогресією."
        },
        {
          "text": " "
        },
        {
          "text": "Формула n-го члена арифметичної прогресії"
        },
        {
          "text": ":"
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "\\(a_{n}= a_{1}+ d (n - 1)\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Формула n-го члена арифметичної прогресії",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Будь-який член арифметичної прогресії, крім першого (і останнього, якщо прогресія є скінченною), дорівнює середньому арифметичному двох сусідніх із ним членів: "
        },
        {
          "text": "a"
        },
        {
          "text": "n",
          "subscript": true
        },
        {
          "text": " ",
          "subscript": true
        },
        {
          "text": "= "
        },
        {
          "text": "\\(\\frac{{a}_{n-1}+{a}_{n+1}}{2}\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Формули суми n перших членів арифметичної прогресії",
          "bold": true
        },
        {
          "text": ": ",
          "bold": true
        },
        {
          "text": "S"
        },
        {
          "text": "n",
          "subscript": true
        },
        {
          "text": " ",
          "subscript": true
        },
        {
          "text": "="
        },
        {
          "text": "\\(\\frac{{a}_{1}+{a}_{n}}{2}\\cdot n\\)",
          "math": true
        },
        {
          "text": " , "
        },
        {
          "text": "S"
        },
        {
          "text": "n",
          "subscript": true
        },
        {
          "text": "= "
        },
        {
          "text": "\\(\\frac{2{a}_{1}+d(n-1)}{2}\\cdot n\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Геометрична прогресія",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Геометричною прогресією називають послідовність із відмінним від нуля першим членом, кожний член якої, починаючи з другого, дорівнює попередньому члену, помноженому на одне й те саме відмінне від нуля число."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Формула n-го члена геометричної прогресії"
        },
        {
          "text": ":"
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "\\({b}_{n}= {b}_{1}{q}^{n-1}\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Властивість членів геометричної прогресії",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Квадрат будь-якого члена геометричної прогресії, крім першого (і останнього, якщо прогресія є скінченною), дорівнює добутку двох сусідніх із ним членів:"
        },
        {
          "text": " "
        },
        {
          "text": "\\({b}_{n}^{2}={b}_{n-1}{b}_{n+1}\\)",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Формула суми n перших членів геометричної прогресії",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "\\[{S}_{n}=\\frac{{b}_{1}({q}^{n}-1)}{q-1}\\]",
          "math": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "22. Теорія ймовірностей"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Класичне означення ймовірності",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Подію, "
        },
        {
          "text": "яка "
        },
        {
          "text": "обов’язково відбудеться",
          "bold": true
        },
        {
          "text": " в будь-якому випробуванні, називають "
        },
        {
          "text": "достовірною",
          "bold": true
        },
        {
          "text": " (вірогідною). Ймовірність такої події вважають рівною 1, тобто: "
        },
        {
          "text": "якщо "
        },
        {
          "text": "A",
          "bold": true
        },
        {
          "text": " — "
        },
        {
          "text": "достовірна подія",
          "bold": true
        },
        {
          "text": ", то "
        },
        {
          "text": "\\(P(A) = 1\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Подію, яка за даним комплексом умов "
        },
        {
          "text": "не може відбутися",
          "bold": true
        },
        {
          "text": " в жодному випробуванні, називають "
        },
        {
          "text": "неможливою",
          "bold": true
        },
        {
          "text": ". Ймовірність такої події вважають рівною 0, тобто:якщо A — неможлива подія, то"
        },
        {
          "text": " "
        },
        {
          "text": "\\(P (A) = 0\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Класичне визначення ймовірності",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Якщо випробування може закінчитися одним з "
        },
        {
          "text": "n",
          "bold": true
        },
        {
          "text": " "
        },
        {
          "text": "рівноможливих"
        },
        {
          "text": " результатів, з яких "
        },
        {
          "text": "m",
          "bold": true
        },
        {
          "text": " приводять до настання події "
        },
        {
          "text": "A",
          "bold": true
        },
        {
          "text": ", то ймовірністю події "
        },
        {
          "text": "A",
          "bold": true
        },
        {
          "text": " називають відношення "
        },
        {
          "text": "\\(\\frac{m}{n}\\)",
          "math": true
        },
        {
          "text": "."
        },
        {
          "text": "   "
        },
        {
          "text": "\\(P\\left(A\\right)= \\frac{m}{n}\\)",
          "math": true
        }
      ]
    }
  ],
  "algebra-10": [
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "Елементарні дії",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Підмножина",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Множину "
        },
        {
          "text": "B",
          "bold": true
        },
        {
          "text": " називають підмножиною множини A, якщо кожний елемент множини "
        },
        {
          "text": "B",
          "bold": true
        },
        {
          "text": " є елементом множини "
        },
        {
          "text": "A",
          "bold": true
        },
        {
          "text": ". Якщо "
        },
        {
          "text": "\\(B\\subset{}A\\)",
          "math": true
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "і"
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "\\(B \\ne{} A\\)",
          "math": true
        },
        {
          "text": ", то множину "
        },
        {
          "text": "B",
          "bold": true
        },
        {
          "text": " називають власною підмножиною множини "
        },
        {
          "text": "A",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Операції над множинами",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        1251,
        9737
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/algebra-10/01-image1.png",
                  "alt": "Ілюстрація 1 до матеріалу «Алгебра 10 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "both",
                  "runs": [
                    {
                      "text": "Перерізом",
                      "bold": true
                    },
                    {
                      "text": " множин "
                    },
                    {
                      "text": "A",
                      "bold": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "B",
                      "bold": true
                    },
                    {
                      "text": " називають "
                    },
                    {
                      "text": "множину",
                      "bold": true
                    },
                    {
                      "text": ", яка складається з усіх елементів, що належать і множині "
                    },
                    {
                      "text": "A",
                      "bold": true
                    },
                    {
                      "text": ", і множині "
                    },
                    {
                      "text": "B",
                      "bold": true
                    },
                    {
                      "text": ". "
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/algebra-10/02-image2.png",
                  "alt": "Ілюстрація 2 до матеріалу «Алгебра 10 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "both",
                  "runs": [
                    {
                      "text": "Об’єднанням",
                      "bold": true
                    },
                    {
                      "text": " множин "
                    },
                    {
                      "text": "A",
                      "bold": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "B",
                      "bold": true
                    },
                    {
                      "text": " називають множину, яка складається з усіх елементів, що належать хоча б одній із цих множин: або множині "
                    },
                    {
                      "text": "A",
                      "bold": true
                    },
                    {
                      "text": ", або множині "
                    },
                    {
                      "text": "B",
                      "bold": true
                    },
                    {
                      "text": ". "
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/algebra-10/03-image3.png",
                  "alt": "Ілюстрація 3 до матеріалу «Алгебра 10 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "both",
                  "runs": [
                    {
                      "text": "Різницею",
                      "bold": true
                    },
                    {
                      "text": " множин "
                    },
                    {
                      "text": "A",
                      "bold": true
                    },
                    {
                      "text": " і "
                    },
                    {
                      "text": "B",
                      "bold": true
                    },
                    {
                      "text": " називають множину, яка складається з усіх елементів, які належать множині "
                    },
                    {
                      "text": "А",
                      "bold": true
                    },
                    {
                      "text": ", але не належать множині "
                    },
                    {
                      "text": "В",
                      "bold": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/algebra-10/04-image4.png",
                  "alt": "Ілюстрація 4 до матеріалу «Алгебра 10 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "both",
                  "runs": [
                    {
                      "text": "У випадку, коли множина "
                    },
                    {
                      "text": "В",
                      "bold": true
                    },
                    {
                      "text": " є підмножиною множини "
                    },
                    {
                      "text": "А",
                      "bold": true
                    },
                    {
                      "text": ", різницю "
                    },
                    {
                      "text": "A \\ B",
                      "bold": true
                    },
                    {
                      "text": " називають "
                    },
                    {
                      "text": "доповненням множини",
                      "bold": true
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "В",
                      "bold": true
                    },
                    {
                      "text": " у множині "
                    },
                    {
                      "text": "А",
                      "bold": true
                    },
                    {
                      "text": "."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "14. Функції",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Функція",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Нехай "
        },
        {
          "text": "X",
          "bold": true
        },
        {
          "text": " — множина значень незалежної змінної, "
        },
        {
          "text": "Y",
          "bold": true
        },
        {
          "text": " — множина значень залежної змінної. Функція — це правило, за допомогою якого за кожним значенням незалежної змінної з множини "
        },
        {
          "text": "X",
          "bold": true
        },
        {
          "text": " можна знайти єдине значення залежної змінної з множини "
        },
        {
          "text": "Y",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Найбільше і найменше значення функції",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Число "
        },
        {
          "text": "f (x",
          "bold": true
        },
        {
          "text": "0",
          "bold": true,
          "subscript": true
        },
        {
          "text": ")",
          "bold": true
        },
        {
          "text": " називають найбільшим значенням функції "
        },
        {
          "text": "f",
          "bold": true
        },
        {
          "text": " на множині "
        },
        {
          "text": "\\(M\\subset{}D (f)\\)",
          "math": true
        },
        {
          "text": ", якщо існує таке число "
        },
        {
          "text": "\\(x_{0}\\in{}M\\)",
          "math": true
        },
        {
          "text": ", що для всіх "
        },
        {
          "text": "\\(x\\in{}M\\)",
          "math": true
        },
        {
          "text": " виконується нерівність "
        },
        {
          "text": "f(x",
          "bold": true
        },
        {
          "text": "0",
          "bold": true,
          "subscript": true
        },
        {
          "text": ") ",
          "bold": true
        },
        {
          "text": "\\(\\ge\\)",
          "math": true
        },
        {
          "text": " f(x)",
          "bold": true
        },
        {
          "text": "Число "
        },
        {
          "text": "f (x",
          "bold": true
        },
        {
          "text": "0",
          "bold": true,
          "subscript": true
        },
        {
          "text": ")",
          "bold": true
        },
        {
          "text": " називають найменшим значенням функції f на множині "
        },
        {
          "text": "\\(M\\subset{}D (f)\\)",
          "math": true
        },
        {
          "text": ", якщо існує таке число "
        },
        {
          "text": "\\(x_{0}\\in{}M\\)",
          "math": true
        },
        {
          "text": ", що для всіх "
        },
        {
          "text": "\\(x\\in{}M\\)",
          "math": true
        },
        {
          "text": " виконується нерівність "
        },
        {
          "text": "f(x",
          "bold": true
        },
        {
          "text": "0",
          "bold": true,
          "subscript": true
        },
        {
          "text": ") ",
          "bold": true
        },
        {
          "text": "\\(\\le\\)",
          "math": true
        },
        {
          "text": " f(x)",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Парні і непарні функції.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Функцію "
        },
        {
          "text": "f",
          "bold": true
        },
        {
          "text": " називають парною, якщо для будь-якого x із області визначення виконується рівність "
        },
        {
          "text": "\\(f (-x) = f (x)\\)",
          "math": true
        },
        {
          "text": ". Функцію "
        },
        {
          "text": "f",
          "bold": true
        },
        {
          "text": " називають непарною, якщо для будь-якого x із області визначення виконується рівність "
        },
        {
          "text": "\\(f (-x) = -f (x)\\)",
          "math": true
        },
        {
          "text": ". "
        },
        {
          "text": "Область визначення ",
          "bold": true
        },
        {
          "text": "парної (непарної) функції є симетричною відносно початку координат. Вісь ординат є віссю симетрії графіка парної функції. Початок координат є центром симетрії графіка непарної функції."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Перетворення графіків функцій",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Графік функції "
        },
        {
          "text": "\\(y = f (kx)\\)",
          "math": true
        },
        {
          "text": " можна отримати з графіка функції "
        },
        {
          "text": "\\(y = f (x)y\\)",
          "math": true
        },
        {
          "text": " результаті стискання в "
        },
        {
          "text": "k",
          "bold": true
        },
        {
          "text": " разів до осі ординат, якщо "
        },
        {
          "text": "\\(k > 1\\)",
          "math": true
        },
        {
          "text": ", або в результаті розтягнення в 1 k "
        },
        {
          "text": "раза"
        },
        {
          "text": " від осі ординат, якщо "
        },
        {
          "text": "\\(0 < k < 1\\)",
          "math": true
        },
        {
          "text": ". Графік функції "
        },
        {
          "text": "\\(y = f (-x)\\)",
          "math": true
        },
        {
          "text": " можна отримати, відобразивши графік функції "
        },
        {
          "text": "\\(y = f (x)\\)",
          "math": true
        },
        {
          "text": " симетрично відносно осі ординат."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Оборотна функція",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Функцію "
        },
        {
          "text": "\\(y = f (x)\\)",
          "math": true
        },
        {
          "text": " називають оборотною, якщо для будь-якого "
        },
        {
          "text": "\\(y0\\in{}E (f)\\)",
          "math": true
        },
        {
          "text": " існує єдине "
        },
        {
          "text": "\\(x0\\in{}D (f)\\)",
          "math": true
        },
        {
          "text": " таке, що "
        },
        {
          "text": "\\(y0 = f (x0)\\)",
          "math": true
        },
        {
          "text": ". Якщо функція є зростаючою (спадною), то вона є оборотною."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Взаємно обернені функції",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Функції f і g називають взаємно оберненими, якщо"
        },
        {
          "text": ": ",
          "bold": true
        },
        {
          "text": "\\(1) D (f) = E (g)\\)",
          "math": true
        },
        {
          "text": " і ",
          "bold": true
        },
        {
          "text": "\\(E (f) = D (g);2)\\)",
          "math": true
        },
        {
          "text": " для будь-якого "
        },
        {
          "text": "\\(x_{0}\\in{}D (f)\\)",
          "math": true
        },
        {
          "text": " із рівності "
        },
        {
          "text": "\\(f (x_{0}) = y_{0}\\)",
          "math": true
        },
        {
          "text": " випливає, що "
        },
        {
          "text": "\\(g (y_{0}) = x_{0}\\)",
          "math": true
        },
        {
          "text": ", тобто "
        },
        {
          "text": "\\(g (f (x_{0})) = x_{0}\\)",
          "math": true
        },
        {
          "text": ". Графіки взаємно обернених функцій симетричні відносно прямої "
        },
        {
          "text": "\\(y = x\\)",
          "math": true
        },
        {
          "text": ". Якщо функція є зростаючою (спадною), то обернена до неї функція є також зростаючою (спадною)."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "6. Математичні вирази",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Ділення многочленів",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Говорять, що многочлен "
        },
        {
          "text": "A (x)",
          "bold": true
        },
        {
          "text": " ділиться націло на тотожно не рівний нулю многочлен "
        },
        {
          "text": "B (x)",
          "bold": true
        },
        {
          "text": ", якщо існує такий многочлен "
        },
        {
          "text": "Q (x)",
          "bold": true
        },
        {
          "text": ", що для будь-якого "
        },
        {
          "text": "\\(x\\in{}R\\)",
          "math": true
        },
        {
          "text": " виконується рівність "
        },
        {
          "text": "\\(A(x)= B(x)\\)",
          "math": true
        },
        {
          "text": "◦",
          "bold": true
        },
        {
          "text": "Q",
          "bold": true
        },
        {
          "text": "(",
          "bold": true
        },
        {
          "text": "x",
          "bold": true
        },
        {
          "text": ")",
          "bold": true
        },
        {
          "text": ". Многочлен "
        },
        {
          "text": "A(x)",
          "bold": true
        },
        {
          "text": " називають діленим, многочлен "
        },
        {
          "text": "B (x)",
          "bold": true
        },
        {
          "text": " — дільником, многочлен "
        },
        {
          "text": "Q (x)",
          "bold": true
        },
        {
          "text": " — часткою. "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Для будь-якого многочлена "
        },
        {
          "text": "A (x)",
          "bold": true
        },
        {
          "text": " і ненульового многочлена "
        },
        {
          "text": "B (x)",
          "bold": true
        },
        {
          "text": " існує єдина пара многочленів "
        },
        {
          "text": "Q (x)",
          "bold": true
        },
        {
          "text": " і "
        },
        {
          "text": "R (x)",
          "bold": true
        },
        {
          "text": " таких, що "
        },
        {
          "text": "\\(A(x)= B(x)\\)",
          "math": true
        },
        {
          "text": "◦"
        },
        {
          "text": "\\(Q(x)+ R x\\)",
          "math": true
        },
        {
          "text": " , де степінь многочлена "
        },
        {
          "text": "R (x)",
          "bold": true
        },
        {
          "text": " менший від степеня многочлена "
        },
        {
          "text": "B (x)",
          "bold": true
        },
        {
          "text": " або "
        },
        {
          "text": "R (x)",
          "bold": true
        },
        {
          "text": " — нульовий многочлен. У цій рівності многочлен "
        },
        {
          "text": "Q (x)",
          "bold": true
        },
        {
          "text": " називають неповною часткою, а многочлен "
        },
        {
          "text": "R (x)",
          "bold": true
        },
        {
          "text": " — остачею."
        },
        {
          "text": " "
        },
        {
          "text": "Число "
        },
        {
          "text": "a",
          "bold": true
        },
        {
          "text": " називають "
        },
        {
          "text": "коренем многочлена",
          "bold": true
        },
        {
          "text": " "
        },
        {
          "text": "A (x)",
          "bold": true
        },
        {
          "text": ", якщо "
        },
        {
          "text": "\\(A (a)= 0\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Властивості коренів многочлена",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Число a є коренем многочлена "
        },
        {
          "text": "A(x) ",
          "bold": true
        },
        {
          "text": "тоді й тільки тоді, коли многочлен A (x) ділиться націло на двочлен x – a. Якщо "
        },
        {
          "text": "{a",
          "bold": true
        },
        {
          "text": "1",
          "bold": true,
          "subscript": true
        },
        {
          "text": ", a",
          "bold": true
        },
        {
          "text": "2",
          "bold": true,
          "subscript": true
        },
        {
          "text": ", ..., ",
          "bold": true
        },
        {
          "text": "a",
          "bold": true
        },
        {
          "text": "n",
          "bold": true,
          "subscript": true
        },
        {
          "text": "}",
          "bold": true
        },
        {
          "text": " — множина коренів многочлена "
        },
        {
          "text": "A (x)",
          "bold": true
        },
        {
          "text": ", то "
        },
        {
          "text": "\\(A(x)=(x-a_{1}) (x-a_{2})\\)",
          "math": true
        },
        {
          "text": "◦"
        },
        {
          "text": "…"
        },
        {
          "text": "◦"
        },
        {
          "text": "("
        },
        {
          "text": "x"
        },
        {
          "text": "-"
        },
        {
          "text": "a"
        },
        {
          "text": "n",
          "subscript": true
        },
        {
          "text": ")"
        },
        {
          "text": " ◦"
        },
        {
          "text": " "
        },
        {
          "text": "Q (x) "
        },
        {
          "text": " де Q (x) — деякий многочлен. Множина коренів многочлена степеня "
        },
        {
          "text": "n",
          "bold": true
        },
        {
          "text": " містить не більше ніж "
        },
        {
          "text": "n",
          "bold": true
        },
        {
          "text": " елементів. Якщо множина коренів многочлена "
        },
        {
          "text": "\\(a_{n}x_{n}+a_{n- 1}x^{n - 1}\\)",
          "math": true
        },
        {
          "text": " + ... + "
        },
        {
          "text": "\\(a_{1}x + a_{0}\\)",
          "math": true
        },
        {
          "text": " містить більше ніж n елементів, то "
        },
        {
          "text": "\\(a_{n}=a_{n}- 1\\)",
          "math": true
        },
        {
          "text": " = ... = "
        },
        {
          "text": "\\(a_{1}= a_{0}= 0\\)",
          "math": true
        },
        {
          "text": ", тобто цей многочлен "
        },
        {
          "text": "тотожно дорівнює нулю",
          "bold": true
        },
        {
          "text": ". "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "Якщо ціле раціональне рівняння із цілими коефіцієнтами має цілий корінь, то він є дільником вільного члена."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Теорема ",
          "bold": true
        },
        {
          "text": "Безу",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Остача від ділення многочлена A (x) на двочлен "
        },
        {
          "text": "x – a",
          "bold": true
        },
        {
          "text": " дорівнює A(a)."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Метод математичної індукції",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Нехай потрібно довести, що деяке твердження є правильним для будь-якого натурального значення n. Доведення цього факту методом математичної індукції складається з двох частин (теорем): 1) База індукції. Доводять (перевіряють) справедливість твердження для "
        },
        {
          "text": "\\(n = 1\\)",
          "math": true
        },
        {
          "text": ". 2) Індуктивний перехід. Роблять припущення, що твердження є правильним для "
        },
        {
          "text": "\\(n = k, k\\)",
          "math": true
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "∈",
          "bold": true
        },
        {
          "text": ", і на підставі цього доводять, що воно є правильним для "
        },
        {
          "text": "\\(n = k + 1\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    }
  ],
  "geometry-7": [
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "3. Елементарна планіметрія",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Геометричні об’єкти.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Точка",
          "bold": true
        },
        {
          "text": " ",
          "bold": true
        },
        {
          "text": "- "
        },
        {
          "text": "цє"
        },
        {
          "text": " геометричний об'єкт, що має тільки положення в просторі. Найпростіший геометричний об’єкт."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Пряма",
          "bold": true
        },
        {
          "text": " - ",
          "bold": true
        },
        {
          "text": "лінія нескінченної довжини, проходить через дві точки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Промінь",
          "bold": true
        },
        {
          "text": " - частина прямої обмежена з однієї сторони. "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Відрізок",
          "bold": true
        },
        {
          "text": " - ",
          "bold": true
        },
        {
          "text": "частина прямої обмежена з двох "
        },
        {
          "text": "сторн"
        },
        {
          "text": "; найкоротша лінія, що з’єднує дві точки. "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Кут",
          "bold": true
        },
        {
          "text": " - геометрична фігура, утворена двома променями, які виходять з однієї точки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Трикутник",
          "bold": true
        },
        {
          "text": " - геометрична фігура, яка складається з трьох точок, що "
        },
        {
          "text": "не лежать на одній прямій",
          "italic": true
        },
        {
          "text": ", і трьох відрізків, які їх сполучають."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Коло",
          "bold": true
        },
        {
          "text": " - це геометричне місце точок площини, відстань від яких до заданої точки, є сталою величиною."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Зв’язки між геометричними об’єктами",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Дві точки",
          "bold": true
        },
        {
          "text": " - дозволяють визначити: "
        },
        {
          "text": "відрізок",
          "bold": true
        },
        {
          "text": ", "
        },
        {
          "text": "промінь ",
          "bold": true
        },
        {
          "text": "та "
        },
        {
          "text": "пряму.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Два ",
          "bold": true
        },
        {
          "text": "променя",
          "bold": true
        },
        {
          "text": ",",
          "bold": true
        },
        {
          "text": " що виходять з однієї точки утворюють "
        },
        {
          "text": "кут.",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Дві прямі",
          "bold": true
        },
        {
          "text": " - що перетинаються, утворюють "
        },
        {
          "text": "перетин прямих",
          "bold": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Три відрізка, ",
          "bold": true
        },
        {
          "text": "які з’єднують "
        },
        {
          "text": "три точки, ",
          "bold": true
        },
        {
          "text": "які не лежать на одній прямій, утворюють трикутник."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Інші визначення",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Множина",
          "bold": true
        },
        {
          "text": " - сукупність, зібрання деяких об’єктів будь-якої природи."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Геометричне місце точок",
          "bold": true
        },
        {
          "text": " - це множина точок, що володіє деякою властивістю."
        },
        {
          "text": "\n"
        },
        {
          "text": "Відстань",
          "bold": true
        },
        {
          "text": " - числове значення того, наскільки далеко знаходяться точки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Довжина ",
          "bold": true
        },
        {
          "text": "- "
        },
        {
          "text": "відстань від точки до точки вздовж деякої лінії."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "7. ",
          "bold": true
        },
        {
          "text": "Обрахункова",
          "bold": true
        },
        {
          "text": " геометрія",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Властивості відрізків",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2518,
        8470
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/01-image1.png",
                  "alt": "Ілюстрація 1 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Довжина відрізка - ",
                      "bold": true
                    },
                    {
                      "text": "відстань між точками "
                    },
                    {
                      "text": "A і B.",
                      "bold": true
                    },
                    {
                      "text": "\n",
                      "bold": true
                    },
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "точка C",
                      "bold": true
                    },
                    {
                      "text": " лежить на відрізку AB, то "
                    },
                    {
                      "text": "довжина",
                      "bold": true
                    },
                    {
                      "text": " відрізка AB дорівнює сумі довжин відрізків AC і CB, тобто "
                    },
                    {
                      "text": "\\(AB = AC + CB (\\)",
                      "math": true
                    },
                    {
                      "text": "основна властивість довжини відрізка",
                      "italic": true
                    },
                    {
                      "text": ")"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Градусна міра кутів.",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2475,
        1965,
        2280,
        2130
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/02-image2.png",
                  "alt": "Ілюстрація 2 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/03-image3.png",
                  "alt": "Ілюстрація 3 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/04-image4.png",
                  "alt": "Ілюстрація 4 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/05-image5.png",
                  "alt": "Ілюстрація 5 до матеріалу «Геометрія 7 клас»"
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Гострий <45",
                      "bold": true
                    },
                    {
                      "text": "°"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Прямий =90",
                      "bold": true
                    },
                    {
                      "text": "°"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Тупий ",
                      "bold": true
                    },
                    {
                      "text": "\\(90^{\\circ}<180^{\\circ}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Розгорнутий = 180",
                      "bold": true
                    },
                    {
                      "text": "°"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Сума кутів",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        1830,
        3120,
        1875,
        4050
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/06-image6.png",
                  "alt": "Ілюстрація 6 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо промінь OC ділить кут AOB на два кути AOC і COB, "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "то "
                    },
                    {
                      "text": "\\(\\angle{}AOB =\\angle{}AOC +\\angle{}COB\\)",
                      "math": true
                    },
                    {
                      "text": ","
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо "
                    },
                    {
                      "text": "\\(\\angle{}AOC =\\angle{}COB\\)",
                      "math": true
                    },
                    {
                      "text": ", то OC називають "
                    },
                    {
                      "text": "бісектрисою",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/07-image7.png",
                  "alt": "Ілюстрація 7 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Два кути утворюють розгорнутий кут - їх "
                    },
                    {
                      "text": "суміжними",
                      "bold": true
                    },
                    {
                      "text": ", сума їх градусних мір дорівнює 180°"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "(одна сторона спільна, а дві інші лежать на одній прямій і не збігаються) "
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Пряма. Перетин прямих. Вертикальні кути.",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2280,
        2580,
        2955,
        2955
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/08-image8.png",
                  "alt": "Ілюстрація 8 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/09-image9.png",
                  "alt": "Ілюстрація 9 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/10-image10.png",
                  "alt": "Ілюстрація 10 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/11-image11.png",
                  "alt": "Ілюстрація 11 до матеріалу «Геометрія 7 клас»"
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Через будь-які дві точки можна провести пряму, і тільки одну."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Дві прямі називають "
                    },
                    {
                      "text": "паралельними",
                      "bold": true
                    },
                    {
                      "text": ", якщо вони не перетинаються."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Будь-які дві прямі, що перетинаються, мають тільки "
                    },
                    {
                      "text": "одну спільну точку",
                      "bold": true
                    },
                    {
                      "text": "."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Перетин прямих ",
                      "bold": true
                    },
                    {
                      "text": "утворює 2 пари вертикальних кутів"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Градусні міри вертикальних кутів є рівними."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Паралельні прямі та січна",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        3285,
        7470
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/12-image12.png",
                  "alt": "Ілюстрація 12 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/13-image13.png",
                  "alt": "Ілюстрація 13 до матеріалу «Геометрія 7 клас»"
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо при перетині двох прямих "
                    },
                    {
                      "text": "\nсічною відповідні кути рівні, "
                    },
                    {
                      "text": "\nто прямі паралельні"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо дві прямі a і b перетнути третьою прямою c, то утвориться вісім кутів. Пряму c називають "
                    },
                    {
                      "text": "січною",
                      "bold": true
                    },
                    {
                      "text": " прямих a і b. Кути 3 і 6, 4 і 5 називають односторонніми. Кути 3 і 5, 4 і 6 називають різносторонніми. Кути 6 і 2, 5 і 1, 3 і 7, 4 і 8 називають відповідними."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Трикутник",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2370,
        3075,
        2235,
        3390
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Трикутник ",
                      "bold": true
                    }
                  ]
                },
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/14-image14.png",
                  "alt": "Ілюстрація 14 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Периметром",
                      "bold": true
                    },
                    {
                      "text": " трикутника називають суму довжин усіх його сторін."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/15-image15.png",
                  "alt": "Ілюстрація 15 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Кути BAC, ABC, BCA називають внутрішніми кутами трикутника ABC."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Їх сума завжди дорівнює 180°"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Бісектриса, медіана, висота трикутника",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        3593,
        3592,
        3592
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "BD – це бісектриса"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "BD – це медіана"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "BD – це висота"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/16-image16.png",
                  "alt": "Ілюстрація 16 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/17-image17.png",
                  "alt": "Ілюстрація 17 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/18-image18.png",
                  "alt": "Ілюстрація 18 до матеріалу «Геометрія 7 клас»"
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Відрізок бісектриси кута трикутника, який сполучає вершину трикутника з точкою протилежної сторони, називають "
                    },
                    {
                      "text": "бісектрисою",
                      "bold": true
                    },
                    {
                      "text": " трикутника."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Відрізок, який сполучає вершину трикутника із серединою протилежної сторони, називають "
                    },
                    {
                      "text": "медіаною",
                      "bold": true
                    },
                    {
                      "text": " трикутника."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": " Перпендикуляр",
                      "italic": true
                    },
                    {
                      "text": ", опущений з вершини трикутника на пряму, яка містить протилежну сторону, називають "
                    },
                    {
                      "text": "висотою",
                      "bold": true
                    },
                    {
                      "text": " трикутника."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Типи трикутників та їх властивості",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        1680,
        1695,
        1875,
        1725,
        1620,
        2175
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/19-image19.png",
                  "alt": "Ілюстрація 19 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "2 сторони рівні."
                    },
                    {
                      "text": "\nКути при основі - рівні."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Медіана, проведена до основи є бісектрисою та висотою."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/20-image20.png",
                  "alt": "Ілюстрація 20 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Всі сторони рівні."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Всі кути рівні і дорівнюють 60°"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Медіана, проведена до будь-якої сторони є бісектрисою та висотою"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/21-image21.png",
                  "alt": "Ілюстрація 21 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(\\angle{}C = 90^{\\circ}\\)",
                      "math": true
                    },
                    {
                      "text": "."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Катет навпроти кута в 30° дорівнює половині гіпотенузи"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Якщо a, b - катети, а с - гіпотенуза, то "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "\\(a<c, b<c, a^{2}+b^{2}=c^{2}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Рівнобедрений",
                      "bold": true
                    }
                  ]
                }
              ],
              "colSpan": 2
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Рівносторонній",
                      "bold": true
                    }
                  ]
                }
              ],
              "colSpan": 2
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "subheading",
                  "align": "center",
                  "runs": [
                    {
                      "text": "Прямокутний",
                      "bold": true
                    }
                  ]
                }
              ],
              "colSpan": 2
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Ознаки рівності трикутників",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        4035,
        4680,
        2235
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/22-image22.png",
                  "alt": "Ілюстрація 22 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/23-image23.png",
                  "alt": "Ілюстрація 23 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/24-image24.png",
                  "alt": "Ілюстрація 24 до матеріалу «Геометрія 7 клас»"
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "1. за двома сторонами та кутом між ними"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "2. стороною та двома прилеглими до неї кутами"
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "sectionHeading",
                  "align": "left",
                  "runs": [
                    {
                      "text": "3. за трьома сторонами"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Геометричне місце точок",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Серединний перпендикуляр відрізка є геометричним місцем точок, рівновіддалених від кінців цього відрізка."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Бісектриса кута є геометричним місцем точок, які належать куту й рівновіддалені від його сторін."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Коло є ",
          "bold": true
        },
        {
          "text": "геометричним місцем точок, відстані від яких до заданої точки дорівнюють даному додатному числу."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Коло",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        2115,
        6780,
        2100
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/25-image25.png",
                  "alt": "Ілюстрація 25 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Будь-який відрізок, який сполучає точку кола з його центром, називають "
                    },
                    {
                      "text": "радіусом",
                      "bold": true
                    },
                    {
                      "text": " кола. "
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Відрізок, який сполучає дві точки кола, називають "
                    },
                    {
                      "text": "хордою",
                      "bold": true
                    },
                    {
                      "text": " кола"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Хорду",
                      "bold": true
                    },
                    {
                      "text": ", яка проходить через центр кола, називають "
                    },
                    {
                      "text": "діаметром",
                      "bold": true
                    },
                    {
                      "text": "."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Пряму, яка має з колом тільки одну спільну точку, називають дотичною до кола."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/26-image26.png",
                  "alt": "Ілюстрація 26 до матеріалу «Геометрія 7 клас»"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "subheading",
      "align": "center",
      "runs": [
        {
          "text": "Властивості діаметра, ",
          "bold": true
        },
        {
          "text": "радіуса",
          "bold": true
        },
        {
          "text": " та дотичної",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "Діаметр кола, перпендикулярний до хорди, ділить цю хорду навпіл. Діаметр кола, який ділить хорду, відмінну від діаметра, навпіл, перпендикулярний до цієї хорди. Дотична до кола перпендикулярна до радіуса, проведеного в точку дотику. Дотична перпендикулярна до радіуса, проведеного в точку дотику."
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        1605,
        7545,
        1845
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/27-image27.png",
                  "alt": "Ілюстрація 27 до матеріалу «Геометрія 7 клас»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Описане та вписане коло трикутника.",
                      "bold": true
                    },
                    {
                      "text": " ",
                      "bold": true
                    },
                    {
                      "text": "Коло називають описаним навколо трикутника, якщо воно проходить через усі його "
                    },
                    {
                      "text": "вершини."
                    },
                    {
                      "text": "Центр"
                    },
                    {
                      "text": " кола, описаного навколо трикутника, — це точка перетину серединних перпендикулярів сторін трикутника."
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Центр кола, вписаного в трикутник, — це точка перетину бісектрис трикутника."
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/geometry-7/28-image28.png",
                  "alt": "Ілюстрація 28 до матеріалу «Геометрія 7 клас»"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "circle-and-angles": [
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "7. ",
          "bold": true
        },
        {
          "text": "Обрахункова",
          "bold": true
        },
        {
          "text": " геометрія",
          "bold": true
        }
      ]
    },
    {
      "type": "table",
      "variant": "grid",
      "columnWidths": [
        1876,
        7796
      ],
      "rows": [
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Малюнок",
                      "bold": true
                    }
                  ]
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Теорія до малюнку",
                      "bold": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/circle-and-angles/01-image1.png",
                  "alt": "Ілюстрація 1 до матеріалу «Коло та кути»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Центральни",
                      "bold": true
                    },
                    {
                      "text": "й",
                      "bold": true
                    },
                    {
                      "text": " кут",
                      "bold": true
                    },
                    {
                      "text": " кола"
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": " - "
                    },
                    {
                      "text": "кут"
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "з вершиною в центрі кол"
                    },
                    {
                      "text": "а"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/circle-and-angles/02-image2.png",
                  "alt": "Ілюстрація 2 до матеріалу «Коло та кути»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "both",
                  "runs": [
                    {
                      "text": "Дуга",
                      "bold": true
                    },
                    {
                      "text": " кола"
                    },
                    {
                      "text": " — "
                    },
                    {
                      "text": "це"
                    },
                    {
                      "text": " одна з "
                    },
                    {
                      "text": "двох"
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "частин"
                    },
                    {
                      "text": " ("
                    },
                    {
                      "text": "підмножин"
                    },
                    {
                      "text": ")"
                    },
                    {
                      "text": " кола, на які його розбивають дві точки кола."
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "Кожна дуга має градусну міру. Градусна міра всього кола дорівнює 360"
                    },
                    {
                      "text": "°"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "both",
                  "runs": [
                    {
                      "text": "Кут ділить коло на дуги. "
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "ADB"
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "та"
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "ADB"
                    },
                    {
                      "text": ". Кут "
                    },
                    {
                      "text": "⦣"
                    },
                    {
                      "text": "AOB"
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "спирається на дугу "
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "ADB"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "both",
                  "runs": [
                    {
                      "text": "Градусна міра",
                      "bold": true
                    },
                    {
                      "text": " дуги, дорівнює градусній мірі центрального кута, який на неї спирається. "
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "\\(ADB=\\widehat{AOB}\\)",
                      "math": true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/circle-and-angles/03-image3.png",
                  "alt": "Ілюстрація 3 до матеріалу «Коло та кути»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Хорда",
                      "bold": true
                    },
                    {
                      "text": " – це відрізок, що з"
                    },
                    {
                      "text": "'"
                    },
                    {
                      "text": "єднує"
                    },
                    {
                      "text": " дві точки, що лежать на колі. "
                    },
                    {
                      "text": "CD",
                      "bold": true
                    },
                    {
                      "text": " – ",
                      "bold": true
                    },
                    {
                      "text": "Хорда."
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "Хорда "
                    },
                    {
                      "text": "CD"
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "стягує дугу "
                    },
                    {
                      "text": " "
                    },
                    {
                      "text": "CED"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/circle-and-angles/04-image4.png",
                  "alt": "Ілюстрація 4 до матеріалу «Коло та кути»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Вписаний кут - ",
                      "bold": true
                    },
                    {
                      "text": "вершина "
                    },
                    {
                      "text": "кута"
                    },
                    {
                      "text": " належить колу, а сторони перетинають коло"
                    },
                    {
                      "text": ". Градусна міра вписаного кута дорівнює половині градусної міри дуги, на яку він спирається"
                    }
                  ]
                },
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "both",
                  "runs": [
                    {
                      "text": "Властивості вписаних кутів: ",
                      "bold": true
                    },
                    {
                      "text": "1) Вписані кути, які спираються на одну й ту саму дугу, рівні; 2) Вписаний кут, який спирається на діаметр (півколо), — прямий."
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/circle-and-angles/05-image5.png",
                  "alt": "Ілюстрація 5 до матеріалу «Коло та кути»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Градусна міра вписаного кута дорівнює половині градусної міри дуги, на яку він спирається"
                    },
                    {
                      "text": ". "
                    },
                    {
                      "text": "\\(\\widehat{AOB}\\)",
                      "math": true
                    },
                    {
                      "text": " = "
                    },
                    {
                      "text": "\\(\\frac{1}{2}\\)",
                      "math": true
                    },
                    {
                      "text": "⦣"
                    },
                    {
                      "text": "ACB"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "cells": [
            {
              "blocks": [
                {
                  "type": "image",
                  "src": "/materials/source/circle-and-angles/06-image6.png",
                  "alt": "Ілюстрація 6 до матеріалу «Коло та кути»"
                }
              ]
            },
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "variant": "body",
                  "align": "left",
                  "runs": [
                    {
                      "text": "Дотична - ",
                      "bold": true
                    },
                    {
                      "text": "пряма, що проходить через точку кола перпендикулярно до радіуса, проведеного в цю точку."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "math-7-algorithms": [
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "7. Рівняння"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №1"
        },
        {
          "text": ". "
        },
        {
          "text": "Вирішення рівнянь"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "1. Перенесіть "
        },
        {
          "text": "доданки",
          "italic": true
        },
        {
          "text": ", які містять "
        },
        {
          "text": "невідоме",
          "bold": true
        },
        {
          "text": " у ліву частину рівняння, а відомі — у праву, змінивши їхній знак на протилежний."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "2. Виконайте "
        },
        {
          "text": "зведення",
          "bold": true
        },
        {
          "text": " "
        },
        {
          "text": "подібних",
          "italic": true
        },
        {
          "text": " доданків."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "3. Поділіть ліву та праву частини рівняння на "
        },
        {
          "text": "коефіцієнт",
          "italic": true
        },
        {
          "text": " при невідомому, якщо він не дорівнює нулю."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "4. Запишіть відповідь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №2"
        },
        {
          "text": ". "
        },
        {
          "text": "Вирішення рівнянь"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "1. Розкрийте дужки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "2. Перенесіть невідомі доданки у ліву частину рівняння, а відомі — у праву, змінивши їхній знак на протилежний."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "3. Виконайте зведення подібних доданків."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "4. Поділіть ліву та праву частини рівняння на коефіцієнт при невідомому, якщо він не дорівнює нулю."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "5. Запишіть відповідь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №3"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "1. Знайдіть "
        },
        {
          "text": "найменший  спільний  знаменник",
          "bold": true
        },
        {
          "text": " усіх дробів."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "2. Домножте кожний член рівняння на найменший спільний знаменник та скоротіть дріб."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "3."
        },
        {
          "text": " Розкрийте дужки",
          "bold": true
        },
        {
          "text": ", якщо вони є."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "4. Перенесіть доданки, які містять невідоме, у ліву частину рівняння, а відомі — у праву, змінивши знаки на протилежні."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "5. Виконайте зведення подібних доданків."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "6. Поділіть ліву та праву частини рівняння на коефіцієнт при невідомому, якщо він не дорівнює нулю."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "7. Запишіть відповідь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": "12. Текстові задачі"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Розв’язування "
        },
        {
          "text": "задач"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №1"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(на складання "
        },
        {
          "text": "рівняння)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "1. Зробіть аналіз умови."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "2."
        },
        {
          "text": " Перекладіть",
          "bold": true
        },
        {
          "text": " задачу зі звичайної мови на мову "
        },
        {
          "text": "алгебраїчну",
          "bold": true
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "3. Невідому величину позначте через x."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "4. Встановіть залежність між даними задачі та змінною."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "5. Складіть рівняння та розв’яжіть його."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "6. Запишіть відповідь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №2"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(на складання системи рівнянь)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Зробіть аналіз умови."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Виділіть дві ситуації."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "3. Перекладіть задачу зі звичайної мови на мову алгебраїчну."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "4. Введіть змінні."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "5. Встановіть залежність між даними задачі та змінними."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "6. Складіть рівняння."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "7. Розв’яжіть систему рівнянь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "8. Запишіть відповідь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": " "
        },
        {
          "text": "6. Математичні вирази"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Множення одночленів. Піднесення одночлена до "
        },
        {
          "text": "ступеня"
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №1"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "1. Знайдіть добуток"
        },
        {
          "text": " коефіцієнтів."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "2. Показники степенів однакових змінних"
        },
        {
          "text": " додайте."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "3. Якщо змінна входить лише в один із множників, то допишіть її в добутку."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №2"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "1. Піднесіть до степеня коефіцієнт одночлена."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "both",
      "runs": [
        {
          "text": "2. Показник степеня кожної змінної одночлена помножте на показник степеня, до якого підноситься одночлен."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Многочлени"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №1"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(додавання "
        },
        {
          "text": "многочленів)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Запишіть послідовно у вигляді алгебраїчної суми всі члени многочлена."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Зведіть подібні доданки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №2"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(віднімання "
        },
        {
          "text": "многочленів)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Знайдіть або складіть різницю многочленів, беручи другий многочлен у дужки зі знаком мінус перед ним."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Розкрийте дужки, змінюючи знаки перед членами, що стоять у дужках, на протилежні."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "3. Зведіть подібні доданки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм № 3"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(добуток одночлена на "
        },
        {
          "text": "многочлен )"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Помножте одночлен на кожний член многочлена."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Додайте одержані добутки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "3. Виконайте зведення подібних доданків."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм № 4"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(добуток многочлена на многочлен)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Помножте кожний член першого многочлена на кожен член другого многочлена."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Додайте одержані добутки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "3. Виконайте зведення подібних доданків."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм № 5"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "right",
      "runs": [
        {
          "text": "(розкладання многочлена на множники)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Винесіть спільний множник за дужки, якщо він є."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Спробуйте застосувати формули скороченого множення."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "3. Застосуйте спосіб групування, якщо попередні способи не дали результату."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "sectionHeading",
      "align": "left",
      "runs": [
        {
          "text": " "
        },
        {
          "text": "8. Рівняння"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Системи рівнянь"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм № 1"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(побудова графіка лінійного рівняння з двома змінними)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Знайдіть значення y, якщо "
        },
        {
          "text": "\\(X=0\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Знайдіть значення x, якщо "
        },
        {
          "text": "\\(Y=0\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "   "
        },
        {
          "text": "3. Зобразіть на координатній площині точки "
        },
        {
          "text": "\\(A ( 0; Y )\\)",
          "math": true
        },
        {
          "text": " і "
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "\\(B ( X; 0 )\\)",
          "math": true
        },
        {
          "text": "."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "listItem",
      "align": "left",
      "runs": [
        {
          "text": "4. Проведіть пряму через дві точки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм № 2"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Побудуйте графік кожного рівняння в одній системі координат."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Знайдіть точки перетину графіків."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "3. Запишіть координати цієї точки."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм №3"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(спосіб алгебраїчного додавання)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Зрівняйте коефіцієнти при змінній x або y так, щоб вони стали протилежними числами."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Додайте почленно ліві та праві частини одержаних рівнянь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "3. Розв’яжіть рівняння з однією змінною."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "4. Знайдене значення змінної підставте в будь-яке рівняння системи."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "5. Знайдіть значення другої змінної."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "6. Запишіть відповідь."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "Алгоритм № 4"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "center",
      "runs": [
        {
          "text": "(спосіб підстановки)"
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "1. Виразіть в одному з рівнянь одну змінну через іншу (x через y або y через x)."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "2. Підставте її значення в друге рівняння."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "3. Розв’яжіть рівняння з однією змінною."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "4. Знайдіть значення другої змінної."
        }
      ]
    },
    {
      "type": "paragraph",
      "variant": "body",
      "align": "left",
      "runs": [
        {
          "text": "   "
        },
        {
          "text": "5. Запишіть відповідь."
        }
      ]
    }
  ]
}
;
