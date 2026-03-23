import { defineStorage } from "@aws-amplify/backend";


export const imagesStorage = defineStorage({
  name: 'images',
  access: (allow) => ({
    'originals/*': [
      allow.authenticated.to(['write', 'delete']),
      allow.guest.to(['read']),          // ← add this line
    ]

  })
})