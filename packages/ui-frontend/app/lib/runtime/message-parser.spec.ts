import { describe, expect, it, vi } from 'vitest';
import { StreamingMessageParser, type ActionCallback, type ArtifactCallback } from './message-parser';

interface ExpectedResult {
  output: string;
  callbacks?: {
    onArtifactOpen?: number;
    onArtifactClose?: number;
    onActionOpen?: number;
    onActionClose?: number;
  };
}

describe('StreamingMessageParser', () => {
  it('should pass through normal text', () => {
    const parser = new StreamingMessageParser();
    expect(parser.parse('test_id', 'Hello, world!')).toBe('Hello, world!');
  });

  it('should allow normal HTML tags', () => {
    const parser = new StreamingMessageParser();
    expect(parser.parse('test_id', 'Hello <strong>world</strong>!')).toBe('Hello <strong>world</strong>!');
  });

  describe('no artifacts', () => {
    it.each<[string | string[], ExpectedResult | string]>([
      ['Foo bar', 'Foo bar'],
      ['Foo bar <', 'Foo bar '],
      ['Foo bar <p', 'Foo bar <p'],
      [['Foo bar <', 's', 'p', 'an>some text</span>'], 'Foo bar <span>some text</span>'],
    ])('should correctly parse chunks and strip out eitherway artifacts (%#)', (input, expected) => {
      runTest(input, expected);
    });
  });

  describe('invalid or incomplete artifacts', () => {
    it.each<[string | string[], ExpectedResult | string]>([
      ['Foo bar <b', 'Foo bar '],
      ['Foo bar <ba', 'Foo bar <ba'],
      ['Foo bar <bol', 'Foo bar '],
      ['Foo bar <eitherway', 'Foo bar '],
      ['Foo bar <eitherwaya', 'Foo bar <eitherwaya'],
      ['Foo bar <eitherwayA', 'Foo bar '],
      ['Foo bar <eitherwayArtifacs></eitherwayArtifact>', 'Foo bar <eitherwayArtifacs></eitherwayArtifact>'],
      ['Before <oltArtfiact>foo</eitherwayArtifact> After', 'Before <oltArtfiact>foo</eitherwayArtifact> After'],
      ['Before <eitherwayArtifactt>foo</eitherwayArtifact> After', 'Before <eitherwayArtifactt>foo</eitherwayArtifact> After'],
    ])('should correctly parse chunks and strip out eitherway artifacts (%#)', (input, expected) => {
      runTest(input, expected);
    });
  });

  describe('valid artifacts without actions', () => {
    it.each<[string | string[], ExpectedResult | string]>([
      [
        'Some text before <eitherwayArtifact title="Some title" id="artifact_1">foo bar</eitherwayArtifact> Some more text',
        {
          output: 'Some text before  Some more text',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 0, onActionClose: 0 },
        },
      ],
      [
        ['Some text before <eitherwayArti', 'fact', ' title="Some title" id="artifact_1">foo</eitherwayArtifact> Some more text'],
        {
          output: 'Some text before  Some more text',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 0, onActionClose: 0 },
        },
      ],
      [
        [
          'Some text before <eitherwayArti',
          'fac',
          't title="Some title" id="artifact_1"',
          ' ',
          '>',
          'foo</eitherwayArtifact> Some more text',
        ],
        {
          output: 'Some text before  Some more text',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 0, onActionClose: 0 },
        },
      ],
      [
        [
          'Some text before <eitherwayArti',
          'fact',
          ' title="Some title" id="artifact_1"',
          ' >fo',
          'o</eitherwayArtifact> Some more text',
        ],
        {
          output: 'Some text before  Some more text',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 0, onActionClose: 0 },
        },
      ],
      [
        [
          'Some text before <eitherwayArti',
          'fact tit',
          'le="Some ',
          'title" id="artifact_1">fo',
          'o',
          '<',
          '/eitherwayArtifact> Some more text',
        ],
        {
          output: 'Some text before  Some more text',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 0, onActionClose: 0 },
        },
      ],
      [
        [
          'Some text before <eitherwayArti',
          'fact title="Some title" id="artif',
          'act_1">fo',
          'o<',
          '/eitherwayArtifact> Some more text',
        ],
        {
          output: 'Some text before  Some more text',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 0, onActionClose: 0 },
        },
      ],
      [
        'Before <eitherwayArtifact title="Some title" id="artifact_1">foo</eitherwayArtifact> After',
        {
          output: 'Before  After',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 0, onActionClose: 0 },
        },
      ],
    ])('should correctly parse chunks and strip out eitherway artifacts (%#)', (input, expected) => {
      runTest(input, expected);
    });
  });

  describe('valid artifacts with actions', () => {
    it.each<[string | string[], ExpectedResult | string]>([
      [
        'Before <eitherwayArtifact title="Some title" id="artifact_1"><eitherwayAction type="shell">npm install</eitherwayAction></eitherwayArtifact> After',
        {
          output: 'Before  After',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 1, onActionClose: 1 },
        },
      ],
      [
        'Before <eitherwayArtifact title="Some title" id="artifact_1"><eitherwayAction type="shell">npm install</eitherwayAction><eitherwayAction type="file" filePath="index.js">some content</eitherwayAction></eitherwayArtifact> After',
        {
          output: 'Before  After',
          callbacks: { onArtifactOpen: 1, onArtifactClose: 1, onActionOpen: 2, onActionClose: 2 },
        },
      ],
    ])('should correctly parse chunks and strip out eitherway artifacts (%#)', (input, expected) => {
      runTest(input, expected);
    });
  });
});

function runTest(input: string | string[], outputOrExpectedResult: string | ExpectedResult) {
  let expected: ExpectedResult;

  if (typeof outputOrExpectedResult === 'string') {
    expected = { output: outputOrExpectedResult };
  } else {
    expected = outputOrExpectedResult;
  }

  const callbacks = {
    onArtifactOpen: vi.fn<ArtifactCallback>((data) => {
      expect(data).toMatchSnapshot('onArtifactOpen');
    }),
    onArtifactClose: vi.fn<ArtifactCallback>((data) => {
      expect(data).toMatchSnapshot('onArtifactClose');
    }),
    onActionOpen: vi.fn<ActionCallback>((data) => {
      expect(data).toMatchSnapshot('onActionOpen');
    }),
    onActionClose: vi.fn<ActionCallback>((data) => {
      expect(data).toMatchSnapshot('onActionClose');
    }),
  };

  const parser = new StreamingMessageParser({
    artifactElement: () => '',
    callbacks,
  });

  let message = '';

  let result = '';

  const chunks = Array.isArray(input) ? input : input.split('');

  for (const chunk of chunks) {
    message += chunk;

    result += parser.parse('message_1', message);
  }

  for (const name in expected.callbacks) {
    const callbackName = name;

    expect(callbacks[callbackName as keyof typeof callbacks]).toHaveBeenCalledTimes(
      expected.callbacks[callbackName as keyof typeof expected.callbacks] ?? 0,
    );
  }

  expect(result).toEqual(expected.output);
}
