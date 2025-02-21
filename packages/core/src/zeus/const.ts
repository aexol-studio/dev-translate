/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Languages: "enum" as const,
	Formality: "enum" as const,
	TranslateInput:{
		languages:"Languages",
		formality:"Formality",
		inputLanguage:"Languages",
		format:"Format"
	},
	ApiMutation:{
		translate:{
			translate:"TranslateInput"
		},
		clearCache:{

		}
	},
	CreateApiKey:{

	},
	PageInput:{

	},
	BigInt: `scalar.BigInt` as const,
	Format: "enum" as const,
	ApiQuery:{
		predictTranslationCost:{
			translate:"TranslateInput"
		},
		translations:{
			page:"PageInput"
		}
	},
	AdminQuery:{
		users:{
			page:"PageInput"
		},
		userById:{

		},
		storedTranslationById:{

		}
	},
	AdminMutation:{
		userOps:{

		}
	},
	UserOps:{
		changeUserTokens:{
			tokens:"BigInt"
		}
	},
	StripeMutation:{
		buyProduct:{

		}
	},
	AuthorizedUserMutation:{
		createApiKey:{
			apiKey:"CreateApiKey"
		},
		revokeApiKey:{

		},
		changePasswordWhenLogged:{
			changePasswordData:"ChangePasswordWhenLoggedInput"
		},
		editUser:{
			updatedUser:"UpdateUserInput"
		},
		integrateSocialAccount:{
			userData:"SimpleUserInput"
		}
	},
	User:{
		translations:{
			page:"PageInput"
		},
		purchases:{
			page:"PageInput"
		}
	},
	PublicUsersQuery:{
		getGoogleOAuthLink:{
			setup:"GetOAuthInput"
		},
		getMicrosoftOAuthLink:{
			setup:"GetOAuthInput"
		},
		getGithubOAuthLink:{
			setup:"GetOAuthInput"
		},
		getAppleOAuthLink:{
			setup:"GetOAuthInput"
		},
		requestForForgotPassword:{

		}
	},
	GetOAuthInput:{

	},
	PublicUsersMutation:{
		register:{
			user:"RegisterInput"
		},
		verifyEmail:{
			verifyData:"VerifyEmailInput"
		},
		changePasswordWithToken:{
			token:"ChangePasswordWithTokenInput"
		},
		generateOAuthToken:{
			tokenData:"GenerateOAuthTokenInput"
		}
	},
	EditUserError: "enum" as const,
	VerifyEmailError: "enum" as const,
	ChangePasswordWhenLoggedError: "enum" as const,
	ChangePasswordWithTokenError: "enum" as const,
	SquashAccountsError: "enum" as const,
	IntegrateSocialAccountError: "enum" as const,
	DeleteAccountError: "enum" as const,
	GenerateOAuthTokenError: "enum" as const,
	UpdateUserInput:{

	},
	GenerateOAuthTokenInput:{
		social:"SocialKind"
	},
	SimpleUserInput:{

	},
	LoginInput:{

	},
	VerifyEmailInput:{

	},
	ChangePasswordWithTokenInput:{

	},
	ChangePasswordWhenLoggedInput:{

	},
	RegisterInput:{

	},
	SocialKind: "enum" as const,
	LoginQuery:{
		password:{
			user:"LoginInput"
		},
		provider:{
			params:"ProviderLoginInput"
		},
		refreshToken:{

		}
	},
	ProviderLoginInput:{

	},
	RegisterErrors: "enum" as const,
	LoginErrors: "enum" as const,
	ProviderErrors: "enum" as const
}

export const ReturnTypes: Record<string,any> = {
	ApiMutation:{
		translate:"TranslationResponse",
		clearCache:"Boolean"
	},
	ApiKey:{
		name:"String",
		value:"String",
		createdAt:"String",
		_id:"String"
	},
	TranslationSingleResponse:{
		language:"Languages",
		result:"String",
		consumedTokens:"BigInt"
	},
	TranslationResponse:{
		results:"TranslationSingleResponse"
	},
	Node:{
		"...on ApiKey": "ApiKey",
		"...on StoredTranslation": "StoredTranslation",
		createdAt:"String",
		_id:"String"
	},
	StoredTranslation:{
		jsonContent:"String",
		results:"TranslationSingleResponse",
		createdAt:"String",
		_id:"String",
		name:"String",
		inputSize:"BigInt",
		consumedTokens:"BigInt",
		format:"Format",
		formality:"Formality",
		context:"String",
		excludePhrases:"String",
		excludeRegex:"String",
		cacheTokens:"BigInt"
	},
	PageInfo:{
		hasNext:"Boolean",
		total:"Int"
	},
	StoredTranslationConnection:{
		items:"StoredTranslation",
		pageInfo:"PageInfo"
	},
	UsersConnection:{
		items:"User",
		pageInfo:"PageInfo"
	},
	BigInt: `scalar.BigInt` as const,
	ApiQuery:{
		predictTranslationCost:"PredictionResponse",
		translations:"StoredTranslationConnection"
	},
	PredictionResponse:{
		cost:"BigInt",
		cached:"BigInt"
	},
	AdminQuery:{
		users:"UsersConnection",
		userById:"User",
		storedTranslationById:"StoredTranslation"
	},
	AdminMutation:{
		userOps:"UserOps"
	},
	UserOps:{
		changeUserTokens:"Boolean"
	},
	StripeQuery:{
		packages:"StripePackage",
		freePlanTokenLimit:"Int"
	},
	StripePackage:{
		name:"String",
		price:"Float",
		tokens:"Int",
		stripeLinkId:"String"
	},
	StripeMutation:{
		buyProduct:"String"
	},
	Purchase:{
		boughtTokens:"BigInt",
		tokenPrice:"Int",
		createdAt:"String",
		_id:"String",
		user:"User"
	},
	PurchaseConnection:{
		items:"Purchase",
		pageInfo:"PageInfo"
	},
	Mutation:{
		webhook:"String",
		api:"ApiMutation",
		users:"UsersMutation"
	},
	AuthorizedUserMutation:{
		createApiKey:"String",
		revokeApiKey:"Boolean",
		api:"ApiMutation",
		admin:"AdminMutation",
		stripe:"StripeMutation",
		changePasswordWhenLogged:"ChangePasswordWhenLoggedResponse",
		editUser:"EditUserResponse",
		integrateSocialAccount:"IntegrateSocialAccountResponse",
		deleteAccount:"DeleteAccountResponse"
	},
	AuthorizedUserQuery:{
		apiKeys:"ApiKey",
		api:"ApiQuery",
		admin:"AdminQuery",
		billingPortalLink:"String",
		me:"User"
	},
	User:{
		_id:"String",
		consumedTokens:"BigInt",
		username:"String",
		emailConfirmed:"Boolean",
		createdAt:"String",
		fullName:"String",
		avatarUrl:"String",
		translations:"StoredTranslationConnection",
		boughtTokens:"BigInt",
		purchases:"PurchaseConnection",
		stripeCustomerId:"String"
	},
	Query:{
		users:"UsersQuery",
		api:"ApiQuery",
		stripe:"StripeQuery"
	},
	UsersQuery:{
		user:"AuthorizedUserQuery",
		publicUsers:"PublicUsersQuery"
	},
	UsersMutation:{
		user:"AuthorizedUserMutation",
		publicUsers:"PublicUsersMutation"
	},
	PublicUsersQuery:{
		login:"LoginQuery",
		getGoogleOAuthLink:"String",
		getMicrosoftOAuthLink:"String",
		getGithubOAuthLink:"String",
		getAppleOAuthLink:"String",
		requestForForgotPassword:"Boolean"
	},
	PublicUsersMutation:{
		register:"RegisterResponse",
		verifyEmail:"VerifyEmailResponse",
		changePasswordWithToken:"ChangePasswordWithTokenResponse",
		generateOAuthToken:"GenerateOAuthTokenResponse"
	},
	EditUserResponse:{
		result:"Boolean",
		hasError:"EditUserError"
	},
	VerifyEmailResponse:{
		result:"Boolean",
		hasError:"VerifyEmailError"
	},
	ChangePasswordWhenLoggedResponse:{
		result:"Boolean",
		hasError:"ChangePasswordWhenLoggedError"
	},
	ChangePasswordWithTokenResponse:{
		result:"Boolean",
		hasError:"ChangePasswordWithTokenError"
	},
	IntegrateSocialAccountResponse:{
		result:"Boolean",
		hasError:"IntegrateSocialAccountError"
	},
	DeleteAccountResponse:{
		result:"Boolean",
		hasError:"DeleteAccountError"
	},
	GenerateOAuthTokenResponse:{
		result:"String",
		hasError:"GenerateOAuthTokenError"
	},
	LoginQuery:{
		password:"LoginResponse",
		provider:"ProviderLoginQuery",
		refreshToken:"String"
	},
	ProviderLoginQuery:{
		apple:"ProviderResponse",
		google:"ProviderResponse",
		github:"ProviderResponse",
		microsoft:"ProviderResponse"
	},
	RegisterResponse:{
		registered:"Boolean",
		hasError:"RegisterErrors"
	},
	LoginResponse:{
		login:"String",
		accessToken:"String",
		refreshToken:"String",
		hasError:"LoginErrors"
	},
	ProviderResponse:{
		jwt:"String",
		accessToken:"String",
		refreshToken:"String",
		providerAccessToken:"String",
		register:"Boolean",
		hasError:"ProviderErrors"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}