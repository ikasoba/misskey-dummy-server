import {
  $any,
  $array,
  $const,
  $intersection,
  $object,
  $opt,
  $record,
  $string,
  $union,
  Infer,
  Validator,
} from "lizod/";

export type JsonLd = {};

type Arrayable<T> = T | T[];
export const $arrayable = <T>($T: Validator<T>) => $union([$T, $array($T)]);

export type ApAny = ApObject;

export const $ApObject = $object({
  "@context": $opt($arrayable($union([$string]))),
  type: $string,
  id: $opt($string),
  attachment: $opt($any),
  attributedTo: $opt($any),
  audience: $opt($any),
  content: $opt($string),
  contentMap: $opt($record($string, $string)),
  context: $opt($string),
  generator: $opt($any),
  image: $opt($any),
});

export type ApObject = Infer<typeof $ApObject>;

export const $ApPerson = $intersection([
  $object({
    type: $const("Person"),
  }),
  $ApObject,
]);

export type ApPerson = Infer<typeof $ApPerson>;

export const $ApImage = $intersection([
  $object({
    type: $const("Image"),
  }),
  $ApObject,
]);

export type ApImage = Infer<typeof $ApImage>;

export const $ApActivity = $intersection([
  $object({
    actor: $opt($ApPerson),
    object: $opt($ApObject),
  }),
  $ApObject,
]);

export type ApActivity = Infer<typeof $ApActivity>;

export const $ApCreate = $intersection([
  $object({
    type: $const("Create"),
  }),
  $ApActivity,
]);

export type ApCreate = Infer<typeof $ApCreate>;
