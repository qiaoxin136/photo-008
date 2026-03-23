import { defineStorage } from "@aws-amplify/backend";


export const imagesStorage = defineStorage({
  name: 'images',
  access: (allow) => ({
    'originals/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
    'originals/*/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
  })
})