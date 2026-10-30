import { describe, expect, it } from 'vitest';
import { methodStory, methodSubskillStories, type MethodNode } from '@mathstudy/animation-engine';
import { practice } from '@mathstudy/content';

function checkCanvas(nodes: MethodNode[], context: string) {
  expect(
    nodes.some((n) => n.kind === 'rect' || n.kind === 'line' || n.kind === 'dot'),
    context,
  ).toBe(true);
  for (const node of nodes) {
    expect(Number.isFinite(node.x) && Number.isFinite(node.y), context).toBe(true);
    expect(node.x, context).toBeGreaterThanOrEqual(0);
    expect(node.y, context).toBeGreaterThanOrEqual(0);
    expect(node.x, context).toBeLessThanOrEqual(400);
    expect(node.y, context).toBeLessThanOrEqual(250);
    if (node.kind === 'rect') {
      expect(node.w, context).toBeGreaterThan(0);
      expect(node.h, context).toBeGreaterThan(0);
      expect(node.x + node.w, context).toBeLessThanOrEqual(400);
      expect(node.y + node.h, context).toBeLessThanOrEqual(250);
    }
    if (node.kind === 'line') {
      expect(Number.isFinite(node.x2) && Number.isFinite(node.y2), context).toBe(true);
      expect(node.x2, context).toBeGreaterThanOrEqual(0);
      expect(node.y2, context).toBeGreaterThanOrEqual(0);
      expect(node.x2, context).toBeLessThanOrEqual(400);
      expect(node.y2, context).toBeLessThanOrEqual(250);
    }
  }
}

describe('complete topic teaching loop', () => {
  it.each(practice.topics)(
    '$id has an observable repair and an independent transfer check',
    (topic) => {
      const story = methodStory(topic.id)!;
      expect(story.transfer, topic.id).toBeDefined();
      expect(story.transfer!.question, topic.id).not.toBe(story.mistake.question);
      for (const [name, check] of [
        ['mistake', story.mistake],
        ['transfer', story.transfer!],
      ] as const) {
        expect(check.right, `${topic.id}:${name}`).not.toBe(check.wrong);
        expect(check.why.length, `${topic.id}:${name}`).toBeGreaterThan(10);
        checkCanvas(check.nodes, `${topic.id}:${name}`);
      }
      expect(story.mistake.wrongNodes, topic.id).toBeDefined();
      expect(story.mistake.wrongNodes, topic.id).not.toEqual(story.mistake.nodes);
      checkCanvas(story.mistake.wrongNodes!, `${topic.id}:wrong`);
      for (const [index, frame] of story.frames.entries())
        checkCanvas(frame.nodes, `${topic.id}:step${index + 1}`);
      if (story.transfer!.wrongNodes)
        checkCanvas(story.transfer!.wrongNodes!, `${topic.id}:transfer-wrong`);
    },
  );
});

describe('matched subskill teaching loop', () => {
  it.each(Object.entries(methodSubskillStories))(
    '%s keeps examples, repairs and transfer on the readable canvas',
    (id, story) => {
      expect(story.frames.length).toBeGreaterThanOrEqual(3);
      expect(new Set(story.frames.map((frame) => JSON.stringify(frame.nodes))).size).toBe(
        story.frames.length,
      );
      for (const [index, frame] of story.frames.entries())
        checkCanvas(frame.nodes, `${id}:${index}`);
      expect(story.transfer).toBeDefined();
      for (const check of [story.mistake, story.transfer!]) {
        expect(check.wrong).not.toBe(check.right);
        expect(check.why.length).toBeGreaterThan(10);
        expect(check.wrongNodes).toBeDefined();
        expect(check.wrongNodes).not.toEqual(check.nodes);
        checkCanvas(check.nodes, `${id}:correct`);
        checkCanvas(check.wrongNodes!, `${id}:wrong`);
      }
    },
  );
});
