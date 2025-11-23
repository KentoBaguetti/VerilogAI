// Verilog code snippets and patterns for better AI completions

export const verilogKeywords = [
  'module', 'endmodule', 'input', 'output', 'inout', 'wire', 'reg',
  'always', 'initial', 'begin', 'end', 'if', 'else', 'case', 'endcase',
  'for', 'while', 'assign', 'parameter', 'localparam', 'generate', 'endgenerate',
  'posedge', 'negedge', 'always_ff', 'always_comb', 'always_latch',
  'logic', 'bit', 'byte', 'integer', 'time', 'real',
];

export interface VerilogSnippet {
  label: string;
  insertText: string;
  detail: string;
  documentation?: string;
}

export const verilogSnippets: VerilogSnippet[] = [
  {
    label: 'module',
    insertText: 'module ${1:module_name} (\n\t${2:// ports}\n);\n\t${3:// module body}\nendmodule',
    detail: 'Module declaration',
    documentation: 'Creates a new Verilog module',
  },
  {
    label: 'always_ff',
    insertText: 'always_ff @(posedge ${1:clk}) begin\n\tif (${2:rst}) begin\n\t\t${3:// reset logic}\n\tend else begin\n\t\t${4:// sequential logic}\n\tend\nend',
    detail: 'Always FF block with reset',
    documentation: 'Creates a synchronous always block',
  },
  {
    label: 'always_comb',
    insertText: 'always_comb begin\n\t${1:// combinational logic}\nend',
    detail: 'Always combinational block',
    documentation: 'Creates a combinational always block',
  },
  {
    label: 'case',
    insertText: 'case (${1:expression})\n\t${2:value}: ${3:statement};\n\tdefault: ${4:statement};\nendcase',
    detail: 'Case statement',
    documentation: 'Creates a case statement',
  },
  {
    label: 'for',
    insertText: 'for (${1:int i = 0}; ${2:i < N}; ${3:i++}) begin\n\t${4:// body}\nend',
    detail: 'For loop',
    documentation: 'Creates a for loop',
  },
  {
    label: 'testbench',
    insertText: 'module ${1:tb_name};\n\t// Clock and reset\n\treg clk = 0;\n\treg rst = 1;\n\t\n\talways #5 clk = ~clk; // 10ns period\n\t\n\tinitial begin\n\t\t$$dumpfile("test.vcd");\n\t\t$$dumpvars(0, ${1:tb_name});\n\t\t\n\t\t#20 rst = 0;\n\t\t${2:// test stimulus}\n\t\t\n\t\t#1000 $$finish;\n\tend\nendmodule',
    detail: 'Testbench template',
    documentation: 'Creates a basic testbench with clock and VCD dumping',
  },
];

// Common Verilog patterns that AI should recognize
export const verilogPatterns = {
  module: /module\s+(\w+)/,
  always: /always(_ff|_comb|_latch)?\s*@?\s*\(/,
  input: /input\s+(logic|wire|reg)?\s*(\[.*?\])?\s*\w+/,
  output: /output\s+(logic|wire|reg)?\s*(\[.*?\])?\s*\w+/,
  assign: /assign\s+\w+\s*=/,
  parameter: /(parameter|localparam)\s+\w+\s*=/,
};

// Detect if we're in a specific Verilog context
export const detectVerilogContext = (text: string): string | null => {
  const lines = text.split('\n');
  const recentLines = lines.slice(-5).join('\n'); // Last 5 lines
  
  if (verilogPatterns.always.test(recentLines)) return 'always_block';
  if (verilogPatterns.module.test(text)) return 'module';
  if (verilogPatterns.assign.test(recentLines)) return 'assign';
  
  return null;
};

