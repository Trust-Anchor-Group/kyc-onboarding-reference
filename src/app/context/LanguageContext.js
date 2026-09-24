import React, { createContext, useContext, useState } from 'react'

export const content = {
  en: {
    step3Subtitle: "We’ll send a secure code to verify your contact details.",
    loading: 'Loading...',
    sideMenu: {
      companyApply: 'Apply as a legal representative for a company',
    },
    home: {
      title: 'Identity Simplified',
      applyButton: 'Apply for personal ID',
      statusButton: 'Log in',
      heroAlt: 'Welcome',
      bullet1: 'Identify yourself using your digital ID to log in, sign contracts and more',
      bullet2: 'In your phone, everywhere you go',
      bullet3: 'Free and seamless registration',
      getDigitalId: {
        title: 'Get your Digital Identity',
        steps: [
          'Select “Create your Digital Identity now”, or follow this link',
          'Respond to the questions in the form and upload the relevant documentation',
          'Download the Neuro-Access App',
          'Open Access and connect the Neuro-Access App to finish your identity verification',
          'Done!',
        ],
        linkLabel: 'Access',
        linkHref: '/',
      },
      images: {
        neuroAccessAlt: 'Neuro Access App preview',
      },
      business: {
        title: 'Do you want to register your business?',
        description: 'Are you the legal representative for a business and want to open an account?',
        steps: [
          'Make sure you already have a Digital Identity',
          'Follow the link and Scan the QR code with your ID',
          'Register your business and wait for approval',
        ],
        cta: 'Apply as Representative for a Business',
      },
      transfer: {
        title: 'How do I transfer my ID to a new phone?',
        intro: 'All you need is the transfer code from your previous phone.',
        steps: [
          'Find and Initiate the transfer under: Settings / Transfer identity',
          'Scan the QR code with your new phone',
          'Create a new Pin and you are done!',
        ],
      },
      reclaim: {
        title: 'I lost access to my ID. How do I reclaim it?',
        intro: 'Did you lose your phone or did the app reset?',
        supportText: 'Get a hold of your ID providers customer support',
        here: 'here',
        help: 'They will help you get your ID back.',
        linkHref: '/',
      },
      blocked: {
        title: 'What do I do if my Digital ID is blocked?',
        supportText: 'Get a hold of your ID providers customer support',
        here: 'here',
        help: 'They will help you get your ID back.',
        linkHref: '/',
      },

    },
    dashboards: {
      title: 'Dashboard',
      statusUpdates: 'Status Updates',
      verifiedAccount: 'Verified Account',
      notAvailable: 'Not available',
      notSet: 'Not set',
      logout: 'Log out',
      logoutSuccess: 'You have been logged out.',
      logoutError: 'Could not log out.',
      emptyTitle: 'No data yet',
      emptySubtitle: 'You will see your account and status here.',
      statusApprovedTitle: 'Application is approved!',
      statusApprovedSubtitle: 'Just a few more steps!',
      inviteTitle: 'Copy your setup code',
      inviteSubtitle: 'This code will connect your ID application to your Neuro-Access App',
      inviteAccessibilityLabel: 'Copy setup code',
      copiedPill: 'Setup code copied!',
      downloadTitle: 'Download the Neuro-Access app',
      downloadSubtitle: 'Download the app and use your setup code to get your digital ID',
      downloadSubtitledesktop: 'Final step!',
      downloadHere: 'Download here:',
      lostCodeTitle: 'In case you forgot your code:',
      letsGo: "Let's go!",
      downloadedTheApp: 'I Have Downloaded The App',
      getTheApp: 'Get the app',
      linktoApp: 'Link account to the App',
      loading: 'Generating…',
      statusApprovedStep1: '1. Download Neuro Access and come back',
      statusApprovedCta: 'I Have Downloaded The App',
      statusStepFinished: 'Finished!',
      statusApprovedStep2: '2. Press “Link account to the App”',
      statusApprovedCta2: 'Link account to the App',
      statusApprovedStep3: '2. Scan the QR code with the App',
      step3Title: 'Scan the QR code to activate your ID',
      statusPendingTitle: 'Application under review',
      statusPendingSubtitle:
        'You will receive an email with a link when the application status changes.',
      statusRejectedTitle: 'Application was rejected',
      statusRejectedSubtitle: 'Please try again or contact support.',
      statusObsoletedTitle: 'Application expired',
      statusObsoletedSubtitle:
        'This application is no longer valid. Please start a new one.',
      statusCompromisedTitle: 'Identity compromised',
      statusCompromisedSubtitle:
        'Your identity has been compromised. Please contact support immediately.',
    },
    messages: {
      messages: 'Messages',
      loading: 'Loading...',
      refresh: 'Refresh',
      newStatus: 'New status update',
      errorTitle: 'Error fetching messages',
      errorMessage: 'Could not fetch messages. Please try again.',
      approved: 'Approved',
      rejected: 'Rejected',
      pending: 'Pending',
      from: 'From',
      defaultSubject: 'Status Update',
      unknownSender: 'Unknown sender',
      statusLabel: 'Status',
      status: {
        approved: 'Approved',
        rejected: 'Rejected',
        created: 'Pending',
      },
      statuss: {
        approved: 'Approved',
        rejected: 'Rejected',
        created: 'Pending',
      },
      unknownTimestamp: 'Unknown time',
      emptyTitle: 'No messages yet',
      emptySubtitle:
        'You will see status updates here as your onboarding progresses.',
    },
    steps: {
      step1: 'Let’s start with your legal name',
      step2: 'Enter your personal number',
      step3: 'Verify your contact details',
      step4: 'Create your account password',
      step5: 'Verify your phone number',
      step6: 'Verify your email address',
      step7: 'What is your date of birth?',
      step8: 'Select your document type',
      step9: 'Upload the front of your document',
      step10: 'Upload the back of your document',
      step11: 'Complete selfie verification',
      step12: 'Enter your address details',
      correct: 'Is everything correct?',
      step13: 'Review and accept terms',
      step14: 'Submitting your identity...',
      // Added keys used only in side menu list
      first: 'Prepare ID',
      review: 'Review',
      halfway: 'Halfway done',
      almost: 'Almost there',
    },
    review: {
      title: 'Review your information',
      description: 'Please confirm your details before continuing. You can edit any section.',
      confirmButton: 'Confirm and continue',
      confirmText: 'I confirm that the above information is correct and I agree to proceed.',
      hint: 'You can still edit any field before moving forward.',
      secureBadge: 'Secure review — encrypted in transit',
      confirmA11y: 'Confirm information is correct',
    },
    first: {
      title: 'Before we begin',
      description: 'Have your valid ID nearby and complete this flow in a well-lit place.',
      checkboxLabel:
        'I have my ID card and/or driver\'s license available and I am ready to start the application process',
      checklistTitle: 'Preparation checklist',
      item1: 'Use your own valid document',
      item2: 'Capture clear photos with no glare',
      item3: 'Your progress is saved automatically',
    },
    accountDetected: {
      title: 'Account detected!',
      subtitle: 'You are signed back in and ready to continue your verification.',
      hint: 'Your previous progress is securely restored.',
    },
    halfway: {
    title: 'Halfway done!',
    phoneLabel: 'Phone',
    phoneStatus: 'Verified',
    emailLabel: 'Email',
    emailStatus: 'Not yet verified',
    },
    almost: {
      title: 'Almost there!',
      back: {
        idCard: 'We also need a picture of the back of your ID card',
        driverLicense: "We also need a picture of the back of your driver's license",
        generic: 'We also need a picture of the back of your document',
      },
      hint: 'Use good lighting and keep all document corners visible.',
    },
    verify: {
      title: 'Confirm your contact details',
      description: 'Please review this information before we send verification codes.',
      checkboxLabel: 'I confirm that this information is correct',
      accountDetailsTitle: 'Account Details',
      phoneLabel: 'Phone number',
      emailLabel: 'Email',
      edit: 'Edit',
    },
    login: {
      title: 'Sign in to your account',
      subtitle: 'Log in to see application status',
      username: 'Username',
      account: 'Personal number',
      password: 'Password',
      confirmPassword: 'Confirm password',
      button: 'Sign In',
      loading: 'Signing in...',
      missing: {
        title: 'Missing fields',
        message: 'Please enter both username and password.',
      },
      failed: {
        title: 'Login failed',
        invalid: 'Invalid credentials',
        unexpected: 'Something went wrong during login',
        userNameOrPassword: 'Invalid personal number or password',
      },
      keyFailed: {
        title: 'Key error',
        message: 'There was a problem with your cryptographic key.',
      },
      success: { title: 'Logged in', message: 'You are now logged in.' },
    },

    descriptions: {
      step1: 'Enter your full legal name exactly as it appears on your ID.',
      step2: 'Your personal number is used only for your legal identity application.',
      step3: 'We’ll verify your email and phone with one-time codes.',
      step4: 'Create a strong password to protect account access.',
      step6: 'Enter the latest code sent to your email.',
      step5: 'Enter the latest code sent to your phone.',
      step7: 'This is required for legal identity verification.',
      step8: 'Choose the document you are about to upload.',
      step9: 'Capture the front side with all details clearly visible.',
      step9b: 'Capture the front side with all details clearly visible.',
      step10: 'Capture the back side with all details clearly visible.',
      step10b: 'Capture the back side with all details clearly visible.',
      step11:
        'Take a clear selfie to confirm liveness and ownership of your ID.',
      step12: 'Enter your current residential address.',
      step13: 'Review and accept the terms to submit your verification.',
    },

    step8Subtitle: "It can be an ID card, driver's license, or passport.",
    labels: {
      enterVerificationCode: 'Enter verification code',
      fullName: 'Full Name',
      documentNumber: 'Personal number',
      email: 'Email',
      phone: 'Phone Number',
      password: 'Password',
      verificationCode: 'Verification Code',
      birthDate: 'Date of Birth',
      address: 'Address',
      street: 'Street Name*',
      zip: 'Zip Code*',
      number: 'Street Number*',
      complement: 'Complement',
      neighborhood: 'Area*',
      city: 'City*',
      country: 'Country*',
      selfie: 'Upload Selfie',
      chooseFile: 'Choose File',
      uploaded: 'Uploaded',
      documentType: 'Document Type',
      passport: 'Passport',
      idCard: 'National ID Card',
      driverLicense: 'Driver License',
      progressLabel: 'Progress',
      progressHint: 'Your progress is securely saved in real time.',
      saved: 'Saved',
      saving: 'Saving…',
      offline: 'Offline',
      securityHint: 'Encrypted session · compliance-grade identity verification',
      uploadFront: 'Upload Front of Document',
      uploadBack: 'Upload Back of Document',
      uploadSelfie: 'Upload Selfie',
      openOnPhone: 'Take this step on your phone',
      openOnPhoneHint: 'Scan the QR code or share the link to continue in the same secure session.',
      mobileLinkCopied: 'Mobile link copied. Open it on your phone.',
      emailVerified: 'Email verified successfully',
      phoneVerified: 'Phone number verified successfully',
      resendIn: 'Resend in',
      resendInProgress: 'Requesting a new code…',
      acceptTerms: 'Accept Terms and Conditions',
      acceptLabel: 'I have read and agree to the terms and conditions.',
      resend: 'Resend Code',
      resent: 'Code resent successfully',
      imagesProgress: {
        '1of2': '1/2 images',
        '2of2': '2/2 images',
      },
    },
    placeholders: {
      fullName: 'Full legal name',
      email: 'you@example.com',
      phone: '+55 11 99999-9999',
      password: '••••••••',
      documentNumber: 'Enter your personal number',
      address: '123 Main Street',
      street: 'Example Street',
      zip: '12345-678',
      neighborhood: 'Neighborhood',
      number: '223',
      complement: 'Apt, Suite',
      city: 'São Paulo',
      country: 'Brazil',
    },
    buttons: {
      captureSelfie: 'Capture a Selfie',
      retake: 'Retake',
      next: 'Next',
      continue: 'Continue',
      back: 'Back',
      submit: 'Submit',
      submitting: 'Submitting...',
      verifying: 'Verifying...',
      verify: 'Verify',
      upload: 'Upload',
      camera: 'Camera',
      copyLink: 'Copy link',
      shareToPhone: 'Share to phone',
      capture: 'Capture',
      cancel: 'Cancel',
      retrySync: 'Retry sync',
      noFace: 'No face detected',
      close: 'Close',


      terms: {
        consentText:
          'By checking the box below, I confirm that I have read and agree to the terms and conditions. I consent to the processing of my personal data in accordance with applicable laws.',
        acceptLabel: 'I have read and agree to the terms and conditions.',
      },
      toasts: {
        submissionCompleteTitle: 'Submission Complete',
        submissionCompleteDesc: 'Your identity has been submitted for review.',
        submissionErrorTitle: 'Error submitting identity',
        submissionErrorDesc: 'Please try again later.',
        loginRedirectNotice: 'You will now be redirected to the login page to access your account and check the status of your application.',

      },

      retry: 'Retake',
    },
    qrcodeInvite: {
      title: 'Invite with QR Code',
      subtitle:
        'Generate a QR code to invite someone to onboarding. Set a PIN for extra security.',
      placeholder: 'Your QR code will appear here after generation.',
      pinPlaceholder: 'Enter a 4+ digit PIN',
      generate: 'Generate QR Code',
      copy: 'Copy Link',
      download: 'Download QR',
      ready: {
        title: 'QR Ready',
        message: 'QR code generated and ready to use.',
      },
      failed: 'Failed to generate QR code',
      notReturned: 'No QR code was returned.',
      missing: { title: 'Missing data', message: 'Key or password missing.' },
      pinErrorTitle: 'PIN Required',
      pinErrorMessage: 'Please enter a PIN with at least 4 digits.',
      copied: {
        title: 'Copied',
        message: 'The onboarding link has been copied.',
      },
      downloadApp: 'Download the Neuro Access app:',
      downloadHere: 'here',
    },
    step5Subtitle: 'Code was sent to',
    step6Subtitle: 'Code was sent to',
    step1Hint: 'Enter your full legal name exactly as shown on your ID.',
    step2Hint: 'Your personal number is encrypted and used only for identity verification.',
    step3Hint: 'Use contact details you can access right now.',
    step4Hints: 'Password requirements',
    step4Rule1: 'At least 6 characters',
    step4Rule2: 'Includes at least one letter',
    step4Rule3: 'Includes at least one number',
    step5Hint: 'Use the 6-digit SMS code. Request a new code if needed.',
    step6Hint: 'Use the latest code from your email inbox.',
    step7Hint: 'You must be at least 18 years old to continue.',
    step8Hint: 'Select the same document type you will upload.',
    step11Hint: 'Keep your face centered, fully visible, and well lit.',
    step12Hint: 'This address is used for compliance and jurisdiction checks.',
    errors: {
      required: 'This field is required.',
      invalidEmail: 'Invalid email address',
      invalidPhone: 'Invalid phone number',
      fileRequired: 'Please upload a file to continue.',
      streetRequired: 'Street address is required',
      zipRequired: 'ZIP code is required',
      neighborhoodRequired: 'Area is required',
      numberRequired: 'Number is required',
      complementRequired: 'Complement is required',
      cityRequired: 'City is required',
      countryRequired: 'State is required',
      fileType: 'Please upload a valid image file.',
      fileSize: 'File size should not exceed 5MB.',
      backRequired: 'Please upload the back side of your document.',
      passwordsDontMatch: 'Passwords do not match.',
      invalidChars: 'Name can only contain letters and spaces.',
      fullNameTwoWords: 'Please enter your first and last name.',
      fullNameWordLength: 'Each name part must be at least 2 letters.',
      selfieRequired: 'Please upload a selfie.',
      invalidDocumentNumber: 'Invalid document number format.',
      passwordWeak: 'Password must be at least 8 characters long and contain letters and numbers.',
      termsRequired: 'You must accept the terms and conditions to continue.',
      invalidPhoneCode: 'Invalid phone verification code.',
      invalidEmailCode: 'Invalid email verification code.',
      networkTimeout: 'Network is taking longer than expected. Please try again.',
      offlineAction: 'You are offline. Reconnect and try again.',
      copyFailed: 'Could not copy link. Please copy it manually.',
      oneMoreAttempt: 'Incorrect code. You have one more attempt before requesting a new code.',
      imageTooDark: 'The photo looks too dark. Increase lighting and retake for best verification accuracy.',
      imageBlurry: 'The photo may be blurry. Hold steady and retake for best verification accuracy.',
      personalNumberInUse: 'This email address already has an Access account. Please sign in.',
      outOfAttempts: 'No attempts left. Please request a new code.',
    },
    actions: {
      tapToEdit: 'Edit',
      tapToEditA11y: 'Edit step',
    },

    // Translations for the "correct" review step page
    correct: {

      cta: 'Everything is correct',
      incompleteCta: 'Complete missing info first',
      incompleteNotice:
        'Some required information or files are missing. Please edit the sections marked and fill them before continuing.',
      notice: 'Before finalizing, please read through and ensure everything is correct.',
      edit: 'Edit',
      editFiles: 'Edit',
      saveChanges: 'Save changes',
      missing: 'Not provided',
      sections: {
        account: 'Account details',
        personal: 'Personal details',
        address: 'Address information',
        files: 'Files',
        Description: 'Your identity photos are ready for verification.',
      },
      rows: {
        accountName: 'Account name',
        email: 'Email',
        phone: 'Phone number',
        givenNames: 'Given names',
        surname: 'Surname',
        birthDate: 'Date of birth',
        documentNumber: 'Document number',
        documentType: 'Document type',
        country: 'Country',
        zip: 'ZIP / Postal code',
        address: 'Address',
        neighborhood: 'Area',
        city: 'City',
        complement: 'Complement',
        fileMissing: 'Not provided',
      },
      files: {
        selfie: 'Selfie photo',
        front: 'Front of ID',
        back: 'Back of ID',
      },
    },

  },
  pt: {
    first: {
      title: 'Antes de começar',
      description: 'Tenha seu documento válido em mãos e conclua em um ambiente bem iluminado.',
      checkboxLabel:
        'Tenho meu RG e/ou CNH disponível e estou pronto(a) para iniciar o processo de cadastro',
      checklistTitle: 'Checklist de preparação',
      item1: 'Use um documento válido e em seu nome',
      item2: 'Tire fotos nítidas, sem reflexo',
      item3: 'Seu progresso é salvo automaticamente',
    },
    step3Subtitle: 'Enviaremos um código seguro para validar seus dados de contato.',
    loading: 'Carregando...',
    sideMenu: {
      companyApply: 'Cadastrar como representante legal de uma empresa',
    },
    home: {
      title: 'Cadastro Simplificado',
      applyButton: 'Cadastrar como pessoa física',
      statusButton: 'Fazer login',
      heroAlt: 'Bem-vindo',
  bullet1: 'Identifique-se usando sua ID digital para entrar, assinar contratos e mais',
  bullet2: 'No seu celular, onde quer que você vá',
  bullet3: 'Cadastro gratuito e simples',
      getDigitalId: {
        title: 'Obtenha sua Identidade Digital',
        steps: [
          'Selecione “Crie sua Identidade Digital agora” ou acesse o link',
          'Responda às perguntas do formulário e envie a documentação necessária',
          'Baixe o aplicativo Neuro-Access',
          'Abra o Access e conecte o aplicativo Neuro-Access para concluir sua verificação de identidade',
          'Pronto!',
        ],
        linkLabel: 'Access',
        linkHref: '/',
      },
      images: {
        neuroAccessAlt: 'Prévia do app Neuro Access',
      },
      business: {
        title: 'Quer registrar sua empresa?',
        description: 'Você é o representante legal da empresa e deseja abrir uma conta?',
        steps: [
          'Certifique-se de já ter uma Identidade Digital',
          'Acesse o link e escaneie o QR code com sua identidade',
          'Registre sua empresa e aguarde a aprovação',
        ],
        cta: 'Cadastrar como representante de uma empresa',
      },
      transfer: {
        title: 'Como transferir minha ID para um novo celular?',
        intro: 'Você só precisa do código de transferência do seu celular antigo.',
        steps: [
          'Encontre e inicie a transferência em: Configurações / Transferir identidade',
          'Escaneie o QR code com seu novo celular',
          'Crie um novo PIN e pronto!',
        ],
      },
      reclaim: {
        title: 'Perdi o acesso à minha ID. Como recuperar?',
        intro: 'Você perdeu o celular ou o app foi resetado?',
        supportText: 'Entre em contato com o suporte do seu provedor de ID',
        here: 'aqui',
        help: 'Eles vão ajudar você a recuperar sua ID.',
        linkHref: '/',
      },
      blocked: {
        title: 'O que fazer se minha ID Digital estiver bloqueada?',
        supportText: 'Entre em contato com o suporte do seu provedor de ID',
        here: 'aqui',
        help: 'Eles vão ajudar você a recuperar sua ID.',
        linkHref: '/',
      },
    },
    dashboards: {
      title: 'Painel',
      statusUpdates: 'Atualizações de status',
      verifiedAccount: 'Conta verificada',
      notAvailable: 'Não disponível',
      notSet: 'Não definido',
      logout: 'Sair',
      logoutSuccess: 'Você saiu da conta.',
      logoutError: 'Não foi possível sair.',
      emptyTitle: 'Nenhum dado ainda',
      emptySubtitle: 'Você verá sua conta e status aqui.',
      statusApprovedTitle: 'Cadastro aprovado!',
      statusApprovedSubtitle: 'Só mais alguns passos.',
      inviteTitle: 'Copie seu código de configuração',
      inviteSubtitle: 'Este código conectará sua aplicação de ID ao seu aplicativo Neuro-Access',
      inviteAccessibilityLabel: 'Copiar código de convite',
      copiedPill: 'Código copiado!',
      downloadTitle: 'Baixe o aplicativo Neuro-Access',
      downloadSubtitle: 'Baixe o aplicativo e use seu código de convite para obter sua ID digital',
      downloadSubtitledesktop: 'Último passo!',
      downloadHere: 'Baixar aqui:',
      lostCodeTitle: 'Caso você tenha esquecido seu código:',
      letsGo: 'Vamos lá!',
      downloadedTheApp: 'Eu baixei o aplicativo',
      getTheApp: 'Baixar o app',
      linktoApp: 'Vincular conta ao App',
      loading: 'Gerando…',
      statusApprovedStep1: '1. Baixe o Neuro-Access para continuar',
      statusApprovedCta: 'Já baixei o app',
      statusStepFinished: 'Finalizado!',
      statusApprovedStep2:
        '2. Clique abaixo para vincular sua conta no aplicativo',
      statusApprovedCta2: 'Vincular conta ao App',
      statusPendingTitle: 'Aplicação em análise',
      statusApprovedStep3: '2. Escaneie o QR code com o App',
      step3Title: 'Escaneie o QR code para ativar sua ID',
      statusPendingSubtitle:
        'Você receberá um e-mail com um link quando o status do seu cadastro for atualizado.',
      statusRejectedTitle: 'Seu cadastro não foi aprovado',
      statusRejectedSubtitle:
        'Por favor, tente novamente ou entre em contato com o suporte.',
      statusObsoletedTitle: 'Cadastro expirado',
      statusObsoletedSubtitle:
        'Este cadastro não está mais válido. Por favor, inicie um novo.',
      statusCompromisedTitle: 'Identidade comprometida',
      statusCompromisedSubtitle:
        'Sua identidade foi comprometida. Entre em contato com o suporte imediatamente.',
    },
    messages: {
      messages: 'Mensagens',
      loading: 'Carregando...',
      refresh: 'Atualizar',
      newStatus: 'Nova atualização de status',
      errorTitle: 'Erro ao buscar mensagens',
      errorMessage: 'Não foi possível buscar mensagens. Tente novamente.',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      pending: 'Pendente',
      from: 'De',
      defaultSubject: 'Atualização de status',
      unknownSender: 'Remetente desconhecido',
      statusLabel: 'Status',
      status: {
        approved: 'Aprovado',
        rejected: 'Rejeitado',
        created: 'Pendente',
      },
      statuss: {
        approved: 'Aprovado',
        rejected: 'Rejeitado',
        created: 'Pendente',
      },
      unknownTimestamp: 'Horário desconhecido',
      emptyTitle: 'Nenhuma mensagem ainda',
      emptySubtitle:
        'Você verá atualizações de status aqui conforme seu onboarding avança.',
    },
    steps: {
      step1: 'Vamos começar pelo seu nome legal',
      step2: 'Informe o seu número pessoal',
      step3: 'Verifique seus dados de contato',
      step4: 'Crie a senha da sua conta',
      step6: 'Verifique seu e-mail',
      step5: 'Verifique seu celular',
      step7: 'Qual é a sua data de nascimento?',
      step8: 'Selecione o tipo de documento',
      step9: 'Envie a frente do seu documento',
      step10: 'Envie o verso do seu documento',
      step11: 'Tire uma selfie',
      step12: 'Informe seu endereço',
      step13: 'Revisar e aceitar termos',
      step14: 'Enviando sua identidade...',
      // Added keys for side menu only
      first: 'Prepare o documento',
      review: 'Revisar',
      halfway: 'Metade concluída',
      almost: 'Quase lá',
      correct: 'Está tudo correto?',
    },
    review: {
      title: 'Revise suas informações',
      description: 'Confirme seus dados antes de continuar. Você pode editar qualquer seção.',
      confirmButton: 'Confirmar e continuar',
      confirmText: 'Confirmo que as informações acima estão corretas e concordo em prosseguir.',
      hint: 'Você ainda pode editar qualquer campo antes de avançar.',
      secureBadge: 'Revisão segura — criptografado em trânsito',
      confirmA11y: 'Confirmar que as informações estão corretas',
    },
    descriptions: {
      step1:
        'Por favor, insira seu nome completo exatamente como aparece em seu documento.',
      step2: 'Usamos seu número pessoal para criar e proteger sua conta de identidade digital.',
      step3: 'Validaremos e-mail e celular com códigos de uso único.',
      step4: 'Crie uma senha forte para proteger o acesso à sua conta.',
      step5:
        'Verifique seu celular para obter o código de verificação enviado por SMS.',
      step6: 'Verifique seu e-mail para obter o código de verificação.',

      step7: 'Usamos isso para confirmar sua identidade legal.',
      step8: 'Selecione o mesmo documento que você irá enviar.',
      step9: 'Capture a frente com todos os dados visíveis.',
      step9b: 'Capture a frente com todos os dados visíveis.',
      step10: 'Capture o verso com todos os dados visíveis.',
      step10b: 'Capture o verso com todos os dados visíveis.',
      step11: 'Tire uma selfie nítida para confirmar prova de vida.',
      step12: 'Informe seu endereço residencial atual.',
      step13:
        'Revise e aceite os termos para concluir o envio da verificação.',
    },
    accountDetected: {
      title: 'Conta detectada!',
      subtitle: 'Você foi autenticado novamente para continuar seu cadastro.',
      hint: 'Seu progresso anterior foi restaurado com segurança.',
    },
    halfway: {
      title: 'Metade concluída!',
      phoneLabel: 'Celular',
      phoneStatus: 'Verificado',
      emailLabel: 'E-mail',
      emailStatus: 'Ainda não verificado',
    },
    almost: {
      title: 'Quase lá!',
      back: {
        idCard: 'Também precisamos de uma foto do verso do seu RG',
        driverLicense: 'Também precisamos de uma foto do verso da sua CNH',
        generic: 'Também precisamos de uma foto do verso do seu documento',
      },
      hint: 'Use boa iluminação e mantenha os cantos do documento visíveis.',
    },
    verify: {
      title: 'Confirme seus dados de contato',
      description: 'Revise estas informações antes de receber os códigos de verificação.',
      checkboxLabel: 'Confirmo que estas informações estão corretas',
      accountDetailsTitle: 'Detalhes da conta',
      phoneLabel: 'Número de celular',
      emailLabel: 'E-mail',
      edit: 'Editar',
    },

    login: {
      title: 'Entrar na sua conta',
      subtitle: 'Faça login para ver o status da aplicação',
      username: 'Usuário',
      account: 'Número pessoal',
      password: 'Senha',
      confirmPassword: 'Confirmar senha',
      button: 'Entrar',
      loading: 'Entrando...',
      missing: {
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha usuário e senha.',
      },
      failed: {
        title: 'Falha no login',
        invalid: 'Credenciais inválidas',
        unexpected: 'Ocorreu um erro ao fazer login',
        userNameOrPassword: 'Número pessoal ou senha inválidos',
      },
      keyFailed: {
        title: 'Erro de chave',
        message: 'Houve um problema com sua chave criptográfica.',
      },
      success: { title: 'Logado', message: 'Você está logado.' },
    },
    step8Subtitle:
      'Pode ser sua carteira de identidade (RG), carteira de motorista (CNH) ou passaporte.',
    labels: {
      enterVerificationCode: 'Insira o código de verificação',
      fullName: 'Nome completo',
      documentNumber: 'Número pessoal',
      email: 'Email',
      phone: 'Número de celular',
      password: 'Senha',
      confirmPassword: 'Confirmar senha',
      verificationCode: 'Código de verificação',
      birthDate: 'Data de nascimento',
      address: 'Endereço',
      street: 'Endereço*',
      number: 'Número*',
      zip: 'CEP*',
      complement: 'Complemento',
      neighborhood: 'Bairro*',
      city: 'Cidade*',
      country: 'País*',
      selfie: 'Envie sua selfie',
      chooseFile: 'Escolher arquivo',
      uploaded: 'Enviado',
      documentType: 'Tipo de documento',
      passport: 'Passaporte',
      idCard: 'Carteira de identidade',
      driverLicense: 'Carteira de motorista',
      progressLabel: 'Progresso',
      progressHint: 'Seu progresso é salvo com segurança em tempo real.',
      saved: 'Salvo',
      saving: 'Salvando…',
      offline: 'Sem conexão',
      securityHint: 'Sessão criptografada · verificação de identidade em conformidade',
      uploadFront: 'Enviar frente do documento',
      uploadBack: 'Enviar verso do documento',
      uploadSelfie: 'Enviar selfie',
      openOnPhone: 'Faça esta etapa no celular',
      openOnPhoneHint: 'Escaneie o QR code ou compartilhe o link para continuar na mesma sessão segura.',
      mobileLinkCopied: 'Link mobile copiado. Abra no seu celular.',
      emailVerified: 'E-mail verificado com sucesso',
      terms: 'Termos e Condições',
      termsAccepted: 'Termos e condições aceitos',
      phoneVerified: 'Número de celular verificado com sucesso',
      resendIn: 'Reenviar em',
      resendInProgress: 'Solicitando novo código…',
      acceptTerms: 'Aceitar termos e condições',
      acceptLabel: 'Eu li e aceito os termos e condições.',
      resend: 'Reenviar código',
      resent: 'Código reenviado com sucesso',
      imagesProgress: {
        '1of2': '1/2 imagens',
        '2of2': '2/2 imagens',
      },

    },
    placeholders: {
      fullName: 'Nome completo',
      email: 'voce@exemplo.com',
      phone: '+55 11 99999-9999',
      password: '••••••••',
      documentNumber: 'Informe o seu número pessoal',
      address: 'Rua Exemplo',
      street: 'Rua Exemplo',
      zip: '12345-678',
      city: 'São Paulo',
      country: 'Brasil',
      neighborhood: 'Bairro',
    },
    buttons: {
      captureSelfie: 'Tirar Selfie',
      retake: 'Tirar novamente',
      next: 'Próximo',
      continue: 'Continuar',
      back: 'Voltar',
      submit: 'Enviar',
      submitting: 'Enviando...',
      verifying: 'Verificando...',
      verify: 'Verificar',
      upload: 'Enviar',
      camera: 'Câmera',
      copyLink: 'Copiar link',
      shareToPhone: 'Compartilhar no celular',
      capture: 'Capturar',
      cancel: 'Cancelar',
      retrySync: 'Tentar sincronizar',
      noFace: 'Nenhum rosto detectado',
      close: 'Fechar',
      terms: {
        consentText:
          'Ao marcar a caixa abaixo, confirmo que li e concordo com os termos e condições. Consinto com o processamento dos meus dados pessoais de acordo com as leis aplicáveis.',
        acceptLabel: 'Eu li e aceito os termos e condições.',
      },
      toasts: {
        submissionCompleteTitle: 'Envio concluído',
        submissionCompleteDesc: 'Sua identidade foi enviada para análise.',
        submissionErrorTitle: 'Erro ao enviar identidade',
        submissionErrorDesc: 'Por favor, tente novamente mais tarde.',
        loginRedirectNotice:'Você será redirecionado para a página de login para acessar sua conta e verificar o status do seu cadastro.',
      },

      retry: 'Tirar novamente',
    },
    qrcodeInvite: {
      title: 'Convide com QR Code',
      subtitle:
        'Gere um QR code para convidar alguém para o onboarding. Defina um PIN para mais segurança.',
      placeholder: 'Seu QR code aparecerá aqui após a geração.',
      pinPlaceholder: 'Digite um PIN com 4+ dígitos',
      generate: 'Gerar QR Code',
      copy: 'Copiar link',
      download: 'Baixar QR',
      ready: {
        title: 'QR Pronto',
        message: 'QR code gerado e pronto para uso.',
      },
      failed: 'Falha ao gerar QR code',
      notReturned: 'Nenhum QR code foi retornado.',
      missing: { title: 'Dados ausentes', message: 'Chave ou senha ausente.' },
      pinErrorTitle: 'PIN obrigatório',
      pinErrorMessage: 'Por favor, insira um PIN com pelo menos 4 dígitos.',
      copied: {
        title: 'Copiado',
        message: 'O link de onboarding foi copiado.',
      },
      downloadApp: 'Baixe o app Neuro Access:',
      downloadHere: 'aqui',
    },
    step5Subtitle: 'O código foi enviado para',
    step6Subtitle: 'O código foi enviado para',
    step1Hint: 'Informe seu nome completo exatamente como está no documento.',
    step2Hint: 'Seu número pessoal é criptografado e usado apenas para verificação de identidade.',
    step3Hint: 'Use e-mail e celular que você consiga acessar agora.',
    step4Hints: 'Requisitos da senha',
    step4Rule1: 'Pelo menos 6 caracteres',
    step4Rule2: 'Inclui ao menos uma letra',
    step4Rule3: 'Inclui ao menos um número',
    step5Hint: 'Use o código SMS de 6 dígitos. Se necessário, peça um novo código.',
    step6Hint: 'Use o código mais recente recebido por e-mail.',
    step7Hint: 'Você deve ter pelo menos 18 anos para continuar.',
    step8Hint: 'Selecione o mesmo tipo de documento que será enviado.',
    step11Hint: 'Mantenha o rosto centralizado, visível e bem iluminado.',
    step12Hint: 'Este endereço é usado em verificações de compliance e jurisdição.',
    errors: {
      required: 'Este campo é obrigatório.',
      invalidEmail: 'Endereço de e-mail inválido',
      invalidPhone: 'Número de telefone inválido',
      fileRequired: 'Envie um arquivo para continuar.',
      streetRequired: 'Endereço é obrigatório',
      zipRequired: 'CEP é obrigatório',
      cityRequired: 'Cidade é obrigatória',
      countryRequired: 'País é obrigatório',
      fileType: 'Por favor, envie um arquivo de imagem válido.',
      fileSize: 'O tamanho do arquivo não deve exceder 5MB.',
      backRequired: 'Por favor, envie o verso do seu documento.',
      passwordsDontMatch: 'As senhas não coincidem.',
      invalidChars: 'O nome só pode conter letras e espaços.',
      fullNameTwoWords: 'Por favor, insira seu primeiro e último nome.',
      fullNameWordLength: 'Cada parte do nome deve ter pelo menos 2 letras.',
      selfieRequired: 'Por favor, envie uma selfie.',
      invalidDocumentNumber: 'Formato de número de documento inválido.',
      invalidDocumentType: 'Tipo de documento inválido. Por favor, escolha um documento válido.',
      invalidVerificationCode: 'Código de verificação inválido.',
      passwordWeak: 'A senha deve ter pelo menos 8 caracteres e conter letras e números.',
      termsRequired: 'Você deve aceitar os termos e condições para continuar.',
      invalidPhoneCode: 'Código de verificação do telefone inválido.',
      invalidEmailCode: 'Código de verificação do e-mail inválido.',
      networkTimeout: 'A rede está demorando mais que o esperado. Tente novamente.',
      offlineAction: 'Você está sem conexão. Reconecte-se e tente novamente.',
      copyFailed: 'Não foi possível copiar o link. Copie manualmente.',
      oneMoreAttempt: 'Código incorreto. Você tem mais uma tentativa antes de solicitar novo código.',
      imageTooDark: 'A foto está muito escura. Melhore a iluminação e tire novamente para melhor verificação.',
      imageBlurry: 'A foto pode estar desfocada. Mantenha firme e tire novamente para melhor verificação.',
      personalNumberInUse: 'Este número pessoal já está em uso. Faça login ou entre em contato com o suporte.',
      outOfAttempts: 'Tentativas esgotadas. Reenvie para receber um novo código.',
    },
    actions: {
      tapToEdit: 'Editar',
      tapToEditA11y: 'Editar etapa',
    },
    // Translations for the "correct" review step page
    correct: {
      cta: 'Tudo está correto',
      incompleteCta: 'Complete as informações faltantes',
      incompleteNotice:
        'Algumas informações ou arquivos obrigatórios estão faltando. Edite as seções marcadas e preencha antes de continuar.',
      notice: 'Antes de finalizar, revise e confirme que tudo está correto.',
      edit: 'Editar',
      editFiles: 'Editar',
      saveChanges: 'Salvar alterações',
      missing: 'Não informado',
      sections: {
        account: 'Detalhes da conta',
        personal: 'Dados pessoais',
        address: 'Endereço',
        files: 'Arquivos',
        Description: 'Suas fotos de identidade estão prontas para verificação.',
      },
      rows: {
        accountName: 'Nome da conta',
        email: 'E-mail',
        phone: 'Número de celular',
        givenNames: 'Prenomes',
        surname: 'Sobrenome',
        birthDate: 'Data de nascimento',
        documentNumber: 'Número do documento',
        documentType: 'Tipo de documento',
        country: 'País',
        zip: 'CEP',
        address: 'Endereço',
        neighborhood: 'Bairro',
        city: 'Cidade',
        complement: 'Complemento',
        fileMissing: 'Não informado',
      },
      files: {
        selfie: 'Foto selfie',
        front: 'Frente do documento',
        back: 'Verso do documento',
      },
    },

  },
}

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sv', label: 'Svenska' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
]

const mergeTranslations = (base, override) => {
  const merged = { ...base }
  Object.entries(override).forEach(([key, value]) => {
    merged[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? mergeTranslations(base[key] || {}, value)
      : value
  })
  return merged
}

// Locales inherit the full English schema so every KYC route always has copy,
// including exceptional camera, recovery, and API-error states.
content.en.access = {
  home: { eyebrow: 'Access / identity', title: 'Prove it’s you.', description: 'A private identity check, finished in a few minutes. Have your ID ready.', partnerDescription: 'asked Access to verify your identity. A private check, finished in a few minutes.', start: 'Start verification', continue: 'Already started? Continue your verification', duration: 'About 5 minutes', idReady: 'Have your ID ready' },
  secure: { title: 'Secure your verification', description: 'Enter your password to return exactly where you left off.', contact: 'Contact', email: 'Your email', phone: 'Your mobile number', security: 'Security', password: 'Password', confirmPassword: 'Confirm password', passwordHint: '8+ characters, including a letter and a number', resume: 'Resume verification', send: 'Send verification codes', error: 'We could not secure your verification. Please try again.', restoreError: 'That password did not restore your verification. Try again.' },
  dashboard: { account: 'Secure Access account', checking: 'Checking your application status.', pending: 'Your application is being reviewed.', approved: 'Your identity is ready.', transfer: 'Bring your identity to Neuro Access.', scan: 'Scan this one-time QR code in the Neuro Access app.', copy: 'Copy transfer link', copied: 'Transfer link copied', pin: 'One-time transfer PIN', underReview: 'We’ll keep you informed', afterApproval: 'Transfer comes after approval' },
}

const localeOverrides = {
  pt: { access: { home: { eyebrow: 'Access / identidade', title: 'Prove que é você.', description: 'Uma verificação de identidade privada, concluída em poucos minutos. Tenha seu documento em mãos.', partnerDescription: 'pediu à Access para verificar sua identidade. Uma verificação privada, concluída em poucos minutos.', start: 'Iniciar verificação', continue: 'Já começou? Continue sua verificação', duration: 'Cerca de 5 minutos', idReady: 'Tenha seu documento em mãos' }, secure: { title: 'Proteja sua verificação', description: 'Digite sua senha para voltar exatamente de onde parou.', contact: 'Contato', email: 'Seu e-mail', phone: 'Seu número de celular', security: 'Segurança', password: 'Senha', confirmPassword: 'Confirmar senha', passwordHint: '8+ caracteres, incluindo uma letra e um número', resume: 'Retomar verificação', send: 'Enviar códigos de verificação', error: 'Não foi possível proteger sua verificação. Tente novamente.', restoreError: 'Essa senha não restaurou sua verificação. Tente novamente.' }, dashboard: { account: 'Conta Access segura', checking: 'Verificando o status do seu cadastro.', pending: 'Seu cadastro está em análise.', approved: 'Sua identidade está pronta.', transfer: 'Leve sua identidade para o Neuro Access.', scan: 'Escaneie este QR code de uso único no app Neuro Access.', copy: 'Copiar link de transferência', copied: 'Link de transferência copiado', pin: 'PIN de transferência de uso único', underReview: 'Vamos manter você informado', afterApproval: 'A transferência acontece após a aprovação' } } },
  sv: {
    access: { home: { eyebrow: 'Access / identitet', title: 'Bevisa att du är du.', description: 'En privat identitetskontroll som är klar på några minuter. Ha din ID-handling redo.', partnerDescription: 'bad Access att verifiera din identitet. En privat kontroll som är klar på några minuter.', start: 'Starta verifiering', continue: 'Redan påbörjat? Fortsätt din verifiering', duration: 'Cirka 5 minuter', idReady: 'Ha din ID-handling redo' }, secure: { title: 'Säkra din verifiering', description: 'Ange ditt lösenord för att fortsätta där du slutade.', contact: 'Kontakt', email: 'Din e-post', phone: 'Ditt mobilnummer', security: 'Säkerhet', password: 'Lösenord', confirmPassword: 'Bekräfta lösenord', passwordHint: 'Minst 8 tecken, inklusive en bokstav och en siffra', resume: 'Återuppta verifiering', send: 'Skicka verifieringskoder', error: 'Det gick inte att säkra din verifiering. Försök igen.', restoreError: 'Lösenordet återställde inte din verifiering. Försök igen.' }, dashboard: { account: 'Säkert Access-konto', checking: 'Kontrollerar status för din ansökan.', pending: 'Din ansökan granskas.', approved: 'Din identitet är klar.', transfer: 'Flytta din identitet till Neuro Access.', scan: 'Skanna denna engångs-QR-kod i Neuro Access-appen.', copy: 'Kopiera överföringslänk', copied: 'Överföringslänk kopierad', pin: 'Engångs-PIN för överföring', underReview: 'Vi håller dig uppdaterad', afterApproval: 'Överföring sker efter godkännande' } },
    home: { title: 'Identitet, förenklad', applyButton: 'Ansök om personligt ID', statusButton: 'Logga in' },
    login: { title: 'Logga in på ditt konto', subtitle: 'Logga in för att se din ansökningsstatus', password: 'Lösenord', button: 'Logga in', loading: 'Loggar in…' },
    steps: { step3: 'Verifiera dina kontaktuppgifter', step5: 'Verifiera ditt telefonnummer', step6: 'Verifiera din e-postadress', step12: 'Ange din adress', step13: 'Granska och godkänn villkor' },
    labels: { fullName: 'Fullständigt namn', phone: 'Telefonnummer', birthDate: 'Födelsedatum', street: 'Gatuadress*', zip: 'Postnummer*', number: 'Gatunummer*', city: 'Ort*', country: 'Land*', documentType: 'Dokumenttyp', passport: 'Pass', idCard: 'Nationellt ID-kort', driverLicense: 'Körkort', resend: 'Skicka kod igen' },
    buttons: { next: 'Nästa', continue: 'Fortsätt', back: 'Tillbaka', submit: 'Skicka in', submitting: 'Skickar in…', verify: 'Verifiera', upload: 'Ladda upp', camera: 'Kamera', cancel: 'Avbryt', retake: 'Ta om' },
    errors: { required: 'Det här fältet är obligatoriskt.', invalidEmail: 'Ogiltig e-postadress', invalidPhone: 'Ogiltigt telefonnummer', invalidPhoneCode: 'Ogiltig telefonverifieringskod.', invalidEmailCode: 'Ogiltig e-postverifieringskod.' },
  },
  fr: {
    access: { home: { eyebrow: 'Access / identité', title: 'Prouvez que vous êtes bien vous.', description: 'Une vérification d’identité privée, terminée en quelques minutes. Gardez votre pièce d’identité à portée de main.', partnerDescription: 'a demandé à Access de vérifier votre identité. Une vérification privée, terminée en quelques minutes.', start: 'Commencer la vérification', continue: 'Déjà commencé ? Continuer votre vérification', duration: 'Environ 5 minutes', idReady: 'Préparez votre pièce d’identité' }, secure: { title: 'Sécurisez votre vérification', description: 'Saisissez votre mot de passe pour reprendre exactement où vous vous êtes arrêté.', contact: 'Coordonnées', email: 'Votre e-mail', phone: 'Votre numéro de mobile', security: 'Sécurité', password: 'Mot de passe', confirmPassword: 'Confirmer le mot de passe', passwordHint: '8 caractères minimum, avec une lettre et un chiffre', resume: 'Reprendre la vérification', send: 'Envoyer les codes de vérification', error: 'Nous n’avons pas pu sécuriser votre vérification. Réessayez.', restoreError: 'Ce mot de passe n’a pas restauré votre vérification. Réessayez.' }, dashboard: { account: 'Compte Access sécurisé', checking: 'Vérification du statut de votre demande.', pending: 'Votre demande est en cours d’examen.', approved: 'Votre identité est prête.', transfer: 'Transférez votre identité vers Neuro Access.', scan: 'Scannez ce QR code à usage unique dans l’application Neuro Access.', copy: 'Copier le lien de transfert', copied: 'Lien de transfert copié', pin: 'PIN de transfert à usage unique', underReview: 'Nous vous tiendrons informé', afterApproval: 'Le transfert est disponible après approbation' } },
    home: { title: 'L’identité simplifiée', applyButton: 'Demander une identité personnelle', statusButton: 'Se connecter' },
    login: { title: 'Connectez-vous à votre compte', subtitle: 'Connectez-vous pour voir le statut de votre demande', password: 'Mot de passe', button: 'Se connecter', loading: 'Connexion…' },
    steps: { step3: 'Vérifiez vos coordonnées', step5: 'Vérifiez votre numéro de téléphone', step6: 'Vérifiez votre adresse e-mail', step12: 'Saisissez votre adresse', step13: 'Vérifiez et acceptez les conditions' },
    labels: { fullName: 'Nom complet', phone: 'Numéro de téléphone', birthDate: 'Date de naissance', street: 'Rue*', zip: 'Code postal*', number: 'Numéro*', city: 'Ville*', country: 'Pays*', documentType: 'Type de document', passport: 'Passeport', idCard: 'Carte nationale d’identité', driverLicense: 'Permis de conduire', resend: 'Renvoyer le code' },
    buttons: { next: 'Suivant', continue: 'Continuer', back: 'Retour', submit: 'Envoyer', submitting: 'Envoi…', verify: 'Vérifier', upload: 'Téléverser', camera: 'Caméra', cancel: 'Annuler', retake: 'Reprendre' },
    errors: { required: 'Ce champ est obligatoire.', invalidEmail: 'Adresse e-mail invalide', invalidPhone: 'Numéro de téléphone invalide', invalidPhoneCode: 'Code de vérification invalide.', invalidEmailCode: 'Code de vérification e-mail invalide.' },
  },
  es: {
    access: { home: { eyebrow: 'Access / identidad', title: 'Demuestra que eres tú.', description: 'Una comprobación privada de identidad, terminada en pocos minutos. Ten tu documento listo.', partnerDescription: 'pidió a Access verificar tu identidad. Una comprobación privada terminada en pocos minutos.', start: 'Iniciar verificación', continue: '¿Ya has empezado? Continúa tu verificación', duration: 'Unos 5 minutos', idReady: 'Ten tu documento listo' }, secure: { title: 'Protege tu verificación', description: 'Introduce tu contraseña para volver exactamente donde lo dejaste.', contact: 'Contacto', email: 'Tu correo electrónico', phone: 'Tu número de móvil', security: 'Seguridad', password: 'Contraseña', confirmPassword: 'Confirmar contraseña', passwordHint: '8+ caracteres, incluida una letra y un número', resume: 'Reanudar verificación', send: 'Enviar códigos de verificación', error: 'No hemos podido proteger tu verificación. Inténtalo de nuevo.', restoreError: 'Esa contraseña no restauró tu verificación. Inténtalo de nuevo.' }, dashboard: { account: 'Cuenta Access segura', checking: 'Comprobando el estado de tu solicitud.', pending: 'Tu solicitud está en revisión.', approved: 'Tu identidad está lista.', transfer: 'Lleva tu identidad a Neuro Access.', scan: 'Escanea este código QR de un solo uso en la app Neuro Access.', copy: 'Copiar enlace de transferencia', copied: 'Enlace de transferencia copiado', pin: 'PIN de transferencia de un solo uso', underReview: 'Te mantendremos informado', afterApproval: 'La transferencia estará disponible tras la aprobación' } },
    home: { title: 'Identidad simplificada', applyButton: 'Solicitar identificación personal', statusButton: 'Iniciar sesión' },
    login: { title: 'Inicia sesión en tu cuenta', subtitle: 'Inicia sesión para ver el estado de tu solicitud', password: 'Contraseña', button: 'Iniciar sesión', loading: 'Iniciando sesión…' },
    steps: { step3: 'Verifica tus datos de contacto', step5: 'Verifica tu número de teléfono', step6: 'Verifica tu correo electrónico', step12: 'Introduce tu dirección', step13: 'Revisa y acepta las condiciones' },
    labels: { fullName: 'Nombre completo', phone: 'Número de teléfono', birthDate: 'Fecha de nacimiento', street: 'Calle*', zip: 'Código postal*', number: 'Número*', city: 'Ciudad*', country: 'País*', documentType: 'Tipo de documento', passport: 'Pasaporte', idCard: 'Documento nacional de identidad', driverLicense: 'Permiso de conducir', resend: 'Reenviar código' },
    buttons: { next: 'Siguiente', continue: 'Continuar', back: 'Atrás', submit: 'Enviar', submitting: 'Enviando…', verify: 'Verificar', upload: 'Subir', camera: 'Cámara', cancel: 'Cancelar', retake: 'Volver a tomar' },
    errors: { required: 'Este campo es obligatorio.', invalidEmail: 'Correo electrónico no válido', invalidPhone: 'Número de teléfono no válido', invalidPhoneCode: 'Código de verificación no válido.', invalidEmailCode: 'Código de verificación de correo no válido.' },
  },
  ar: {
    access: { home: { eyebrow: 'أكسس / الهوية', title: 'أثبت أنك أنت.', description: 'تحقق خاص من الهوية يكتمل خلال دقائق. جهّز وثيقة هويتك.', partnerDescription: 'طلب من Access التحقق من هويتك. تحقق خاص يكتمل خلال دقائق.', start: 'ابدأ التحقق', continue: 'هل بدأت بالفعل؟ تابع التحقق', duration: 'حوالي 5 دقائق', idReady: 'جهّز وثيقة هويتك' }, secure: { title: 'أمّن عملية التحقق', description: 'أدخل كلمة المرور للعودة إلى المكان الذي توقفت عنده.', contact: 'بيانات الاتصال', email: 'بريدك الإلكتروني', phone: 'رقم هاتفك المحمول', security: 'الأمان', password: 'كلمة المرور', confirmPassword: 'تأكيد كلمة المرور', passwordHint: '8 أحرف أو أكثر، تشمل حرفًا ورقمًا', resume: 'استئناف التحقق', send: 'إرسال رموز التحقق', error: 'تعذر تأمين عملية التحقق. حاول مرة أخرى.', restoreError: 'لم تستعد كلمة المرور هذه عملية التحقق. حاول مرة أخرى.' }, dashboard: { account: 'حساب Access آمن', checking: 'جارٍ التحقق من حالة طلبك.', pending: 'طلبك قيد المراجعة.', approved: 'هويتك جاهزة.', transfer: 'انقل هويتك إلى Neuro Access.', scan: 'امسح رمز QR هذا للاستخدام مرة واحدة في تطبيق Neuro Access.', copy: 'نسخ رابط النقل', copied: 'تم نسخ رابط النقل', pin: 'رمز PIN للنقل لمرة واحدة', underReview: 'سنبقيك على اطلاع', afterApproval: 'يتوفر النقل بعد الموافقة' } },
    home: { title: 'الهوية ببساطة', applyButton: 'التقدم للحصول على هوية شخصية', statusButton: 'تسجيل الدخول' },
    login: { title: 'سجّل الدخول إلى حسابك', subtitle: 'سجّل الدخول لمتابعة حالة طلبك', password: 'كلمة المرور', button: 'تسجيل الدخول', loading: 'جارٍ تسجيل الدخول…' },
    steps: { step3: 'تحقق من بيانات الاتصال', step5: 'تحقق من رقم الهاتف', step6: 'تحقق من البريد الإلكتروني', step12: 'أدخل عنوانك', step13: 'راجع الشروط واقبلها' },
    labels: { fullName: 'الاسم الكامل', phone: 'رقم الهاتف', birthDate: 'تاريخ الميلاد', street: 'الشارع*', zip: 'الرمز البريدي*', number: 'رقم المبنى*', city: 'المدينة*', country: 'البلد*', documentType: 'نوع المستند', passport: 'جواز السفر', idCard: 'بطاقة الهوية الوطنية', driverLicense: 'رخصة القيادة', resend: 'إعادة إرسال الرمز' },
    buttons: { next: 'التالي', continue: 'متابعة', back: 'رجوع', submit: 'إرسال', submitting: 'جارٍ الإرسال…', verify: 'تحقق', upload: 'رفع', camera: 'الكاميرا', cancel: 'إلغاء', retake: 'إعادة الالتقاط' },
    errors: { required: 'هذا الحقل مطلوب.', invalidEmail: 'عنوان البريد الإلكتروني غير صالح', invalidPhone: 'رقم الهاتف غير صالح', invalidPhoneCode: 'رمز التحقق من الهاتف غير صالح.', invalidEmailCode: 'رمز التحقق من البريد الإلكتروني غير صالح.' },
  },
}

Object.entries(localeOverrides).forEach(([language, overrides]) => {
  content[language] = mergeTranslations(content[language] || content.en, overrides)
})

const dashboardCopy = {
  en: { ready: 'Ready to transfer', openApp: 'Download or open the Neuro Access app.', selectTransfer: 'Select Transfer identity in the app.', scanPin: 'Scan the QR code and confirm the transfer using the PIN below.', needApp: 'Need the app first?', creating: 'Creating a secure QR code…', unavailable: 'QR code unavailable', retry: 'Create a new QR code', refreshSession: 'Your secure transfer session needs refreshing. Sign out and sign in again, then create a new QR code.', qrFailed: 'We could not create a QR code. Please try again.', security: 'For your security, generate a new QR code if you leave this page or share it with anyone.', reviewInfo: 'You’ll receive an email as soon as the review changes. This dashboard always shows the latest available status.', transferInfo: 'Once approved, return here to scan a secure QR code and add your identity to the Neuro Access app.' },
  sv: { ready: 'Redo att överföra', openApp: 'Ladda ner eller öppna Neuro Access-appen.', selectTransfer: 'Välj Överför identitet i appen.', scanPin: 'Skanna QR-koden och bekräfta överföringen med PIN-koden nedan.', needApp: 'Behöver du appen först?', creating: 'Skapar en säker QR-kod…', unavailable: 'QR-kod är inte tillgänglig', retry: 'Skapa en ny QR-kod', refreshSession: 'Din säkra överföringssession behöver uppdateras. Logga ut och in igen och skapa sedan en ny QR-kod.', qrFailed: 'Det gick inte att skapa en QR-kod. Försök igen.', security: 'Skapa en ny QR-kod om du lämnar sidan eller delar den med någon.', reviewInfo: 'Du får ett e-postmeddelande när granskningen ändras. Den här vyn visar alltid senaste status.', transferInfo: 'När du har godkänts kan du komma tillbaka hit och skanna en säker QR-kod för att lägga till din identitet i Neuro Access-appen.' },
  fr: { ready: 'Prêt à transférer', openApp: 'Téléchargez ou ouvrez l’application Neuro Access.', selectTransfer: 'Sélectionnez Transférer l’identité dans l’application.', scanPin: 'Scannez le QR code et confirmez le transfert avec le PIN ci-dessous.', needApp: 'Besoin de l’application ?', creating: 'Création d’un QR code sécurisé…', unavailable: 'QR code indisponible', retry: 'Créer un nouveau QR code', refreshSession: 'Votre session de transfert sécurisée doit être actualisée. Déconnectez-vous, reconnectez-vous, puis créez un nouveau QR code.', qrFailed: 'Nous n’avons pas pu créer le QR code. Réessayez.', security: 'Pour votre sécurité, créez un nouveau QR code si vous quittez cette page ou le partagez.', reviewInfo: 'Vous recevrez un e-mail lorsque l’examen évolue. Ce tableau de bord affiche toujours le dernier statut.', transferInfo: 'Une fois approuvé, revenez ici pour scanner un QR code sécurisé et ajouter votre identité à l’application Neuro Access.' },
  es: { ready: 'Listo para transferir', openApp: 'Descarga o abre la app Neuro Access.', selectTransfer: 'Selecciona Transferir identidad en la app.', scanPin: 'Escanea el código QR y confirma la transferencia con el PIN de abajo.', needApp: '¿Necesitas la app primero?', creating: 'Creando un código QR seguro…', unavailable: 'Código QR no disponible', retry: 'Crear un nuevo código QR', refreshSession: 'Tu sesión de transferencia segura necesita actualizarse. Cierra sesión e inicia sesión de nuevo; después crea un código QR nuevo.', qrFailed: 'No hemos podido crear el código QR. Inténtalo de nuevo.', security: 'Por seguridad, crea un nuevo código QR si sales de esta página o lo compartes.', reviewInfo: 'Recibirás un correo cuando cambie la revisión. Este panel siempre muestra el estado más reciente.', transferInfo: 'Cuando se apruebe tu solicitud, vuelve aquí para escanear un código QR seguro y añadir tu identidad a la app Neuro Access.' },
  pt: { ready: 'Pronto para transferir', openApp: 'Baixe ou abra o app Neuro Access.', selectTransfer: 'Selecione Transferir identidade no app.', scanPin: 'Escaneie o QR code e confirme a transferência com o PIN abaixo.', needApp: 'Precisa do app primeiro?', creating: 'Criando um QR code seguro…', unavailable: 'QR code indisponível', retry: 'Criar novo QR code', refreshSession: 'Sua sessão segura de transferência precisa ser atualizada. Saia e entre novamente e depois crie um novo QR code.', qrFailed: 'Não foi possível criar o QR code. Tente novamente.', security: 'Por segurança, crie um novo QR code se sair desta página ou compartilhá-lo.', reviewInfo: 'Você receberá um e-mail quando a análise mudar. Este painel sempre mostra o status mais recente.', transferInfo: 'Após a aprovação, volte aqui para escanear um QR code seguro e adicionar sua identidade ao app Neuro Access.' },
  ar: { ready: 'جاهز للنقل', openApp: 'نزّل أو افتح تطبيق Neuro Access.', selectTransfer: 'اختر نقل الهوية في التطبيق.', scanPin: 'امسح رمز QR وأكّد النقل باستخدام رمز PIN أدناه.', needApp: 'هل تحتاج التطبيق أولاً؟', creating: 'جارٍ إنشاء رمز QR آمن…', unavailable: 'رمز QR غير متاح', retry: 'إنشاء رمز QR جديد', refreshSession: 'تحتاج جلسة النقل الآمنة إلى التحديث. سجّل الخروج ثم الدخول مجددًا، وبعدها أنشئ رمز QR جديدًا.', qrFailed: 'تعذر إنشاء رمز QR. حاول مرة أخرى.', security: 'لحمايتك، أنشئ رمز QR جديدًا إذا غادرت هذه الصفحة أو شاركته مع أي شخص.', reviewInfo: 'ستتلقى بريدًا إلكترونيًا عند تغير المراجعة. تعرض هذه اللوحة دائمًا أحدث حالة.', transferInfo: 'بعد الموافقة، عُد إلى هنا لمسح رمز QR آمن وإضافة هويتك إلى تطبيق Neuro Access.' },
}

Object.entries(dashboardCopy).forEach(([language, copy]) => {
  content[language].access.dashboard = { ...content[language].access.dashboard, ...copy }
})

const launchJourneyCopy = {
  sv: { steps: { step1: 'Om dig', step8: 'Välj den ID-handling du vill använda', step9: 'Framsidan av din ID-handling', step10: 'Baksidan av din ID-handling', step11: 'Ta en tydlig selfie', step12: 'Var bor du?', step13: 'Granska och skicka in' }, descriptions: { step1: 'Ange uppgifterna exakt som de står på din ID-handling.', step5: 'Ange den senaste koden som skickades till din telefon.', step6: 'Ange den senaste koden från din e-post.', step8: 'Använd samma dokument för alla bilder i verifieringen.', step9: 'Se till att alla hörn, ditt namn och ditt foto syns tydligt.', step10: 'Se till att alla hörn och uppgifter på baksidan syns tydligt.', step11: 'Håll ansiktet centrerat och använd bra belysning.', step12: 'Ange din nuvarande bostadsadress.', step13: 'Granska och godkänn villkoren för att skicka in verifieringen.' } },
  fr: { steps: { step1: 'À propos de vous', step8: 'Choisissez la pièce d’identité à utiliser', step9: 'Recto de votre pièce d’identité', step10: 'Verso de votre pièce d’identité', step11: 'Prenez un selfie net', step12: 'Où habitez-vous ?', step13: 'Vérifiez et envoyez' }, descriptions: { step1: 'Saisissez les informations exactement comme elles figurent sur votre pièce d’identité.', step5: 'Saisissez le dernier code envoyé à votre téléphone.', step6: 'Saisissez le dernier code reçu par e-mail.', step8: 'Utilisez le même document pour toutes les photos de cette vérification.', step9: 'Assurez-vous que tous les coins, votre nom et votre photo sont nets.', step10: 'Assurez-vous que tous les coins et les informations au verso sont nets.', step11: 'Gardez votre visage centré et utilisez un bon éclairage.', step12: 'Saisissez votre adresse de résidence actuelle.', step13: 'Vérifiez et acceptez les conditions pour envoyer votre vérification.' } },
  es: { steps: { step1: 'Sobre ti', step8: 'Elige el documento de identidad que usarás', step9: 'Anverso de tu documento', step10: 'Reverso de tu documento', step11: 'Hazte un selfie nítido', step12: '¿Dónde vives?', step13: 'Revisa y envía' }, descriptions: { step1: 'Introduce los datos exactamente como aparecen en tu documento de identidad.', step5: 'Introduce el último código enviado a tu teléfono.', step6: 'Introduce el último código recibido por correo.', step8: 'Usa el mismo documento para todas las fotos de esta verificación.', step9: 'Asegúrate de que se vean bien las esquinas, tu nombre y tu foto.', step10: 'Asegúrate de que se vean bien las esquinas y los datos del reverso.', step11: 'Centra el rostro y utiliza buena iluminación.', step12: 'Introduce tu dirección de residencia actual.', step13: 'Revisa y acepta las condiciones para enviar tu verificación.' } },
  ar: { steps: { step1: 'معلومات عنك', step8: 'اختر وثيقة الهوية التي ستستخدمها', step9: 'الوجه الأمامي لوثيقة الهوية', step10: 'الوجه الخلفي لوثيقة الهوية', step11: 'التقط صورة ذاتية واضحة', step12: 'أين تسكن؟', step13: 'راجع وأرسل' }, descriptions: { step1: 'أدخل البيانات تمامًا كما تظهر في وثيقة هويتك.', step5: 'أدخل أحدث رمز أُرسل إلى هاتفك.', step6: 'أدخل أحدث رمز وصل إلى بريدك الإلكتروني.', step8: 'استخدم الوثيقة نفسها في جميع صور عملية التحقق.', step9: 'تأكد من وضوح جميع الزوايا واسمك وصورتك.', step10: 'تأكد من وضوح جميع الزوايا والبيانات في الخلف.', step11: 'اجعل وجهك في المنتصف واستخدم إضاءة جيدة.', step12: 'أدخل عنوان سكنك الحالي.', step13: 'راجع الشروط ووافق عليها لإرسال عملية التحقق.' } },
}

Object.entries(launchJourneyCopy).forEach(([language, copy]) => {
  content[language] = mergeTranslations(content[language], copy)
})

// Copy used by the launch onboarding surfaces. Keeping this contract together
// makes exceptional, validation, dialog, and completion states as translatable
// as the primary headings.
const launchUiCopy = {
  en: {
    common: { close: 'Close', cancel: 'Cancel', save: 'Save changes', continue: 'Continue', password: 'Password', showPassword: 'Show password', hidePassword: 'Hide password', saving: 'Saving securely…', saved: 'Saved securely' },
    about: { eyebrow: 'Identity details', title: 'A precise match starts with the basics.', compact: 'Match your ID exactly.', body: 'Enter the details exactly as they appear on your document. You’ll be able to review and edit them before submission.', legalName: 'Legal name', birthDate: 'Date of birth', personalNumber: 'Personal number', personalNumberHint: 'Used only for this legal identity application.', nameReady: 'Name ready' },
    address: { guidance: 'Address guidance', eyebrow: 'Address', title: 'Let Access do the lookup work.', body: 'Start with your postal code. We’ll fill what we can, and you can adjust anything before continuing.', find: 'Find your address', findHint: 'Enter your postal code first and we’ll fill what we can.', looking: 'Looking up your address…', found: 'Address details found — check and edit them below.', notFound: 'We couldn’t find that code. You can enter the address manually.', yourAddress: 'Your address', selectCountry: 'Select country', streetRequired: 'Street address is required', zipRequired: 'Postal code is required', numberRequired: 'Number is required', neighborhoodRequired: 'Area is required', cityRequired: 'City is required', countryRequired: 'Country is required' },
    review: { everythingRight: 'Everything looks right', acceptFirst: 'Accept terms to continue', accountDescription: 'Your verified contact details protect this verification.', requested: 'Requested verification', acceptTitle: 'Review and accept', requestBody: 'Athletes and You requested this verification through Access. By continuing, you confirm that your details and photos are truthful and belong to you.', readTerms: 'Read the terms', consent: 'I have read and agree to the terms for this verification.', address: 'Address', updateAddress: 'Update your address', personal: 'Personal details', updatePersonal: 'Update your details', postalCode: 'Postal code', street: 'Street address', number: 'Number', unit: 'Apartment or unit (optional)', area: 'Area', city: 'City', fullLegalName: 'Full legal name', birthDate: 'Date of birth', personalNumber: 'Personal number' },
    submission: { done: 'Done', title: 'You’re all set.', body: 'Your verification was submitted successfully. You can close this page now, or log in any time to follow your application.', next: 'What happens next', nextBody: 'The verification team will review your application. We’ll email you when your review is complete.', track: 'Track your application', trackBody: 'Log in to check your application status whenever you wish. Once approved, your account will show how to transfer your ID to the Neuro Access app.', login: 'Log in to check your status', loginHint: 'Use the email and password you created during this application.', retry: 'Retry submission', submitting: 'Submitting your verification…', failed: 'We could not finish your submission.', savedSecureLink: 'Your details and photos are still saved. Open Access using its secure link and try again.', savedRetry: 'Your details and photos are still saved. Try again in a moment.', reauthTitle: 'Continue your verification', reauthBody: 'For your security, confirm your password to continue.', passwordRejected: 'That password wasn’t accepted. Try again.', confirming: 'Confirming…', readyLabel: 'Ready to submit', readyTitle: 'Your verification is ready.', readyBody: 'You’ve reviewed your information and accepted the terms. Submit when you’re ready and we’ll begin the verification review.' },
    secureJourney: { contact: 'Contact', identity: 'Identity', review: 'Review', autoSave: 'Progress saves automatically.', orientation: 'Verification orientation', progress: 'Secure, identity, review', securing: 'Securing your verification…' },
  },
  sv: {
    common: { close: 'Stäng', cancel: 'Avbryt', save: 'Spara ändringar', continue: 'Fortsätt', password: 'Lösenord', showPassword: 'Visa lösenord', hidePassword: 'Dölj lösenord', saving: 'Sparar säkert…', saved: 'Sparat säkert' },
    about: { eyebrow: 'Identitetsuppgifter', title: 'En exakt matchning börjar med rätt grunduppgifter.', compact: 'Matcha din ID-handling exakt.', body: 'Ange uppgifterna precis som de står på din handling. Du kan granska och ändra dem före inskick.', legalName: 'Juridiskt namn', birthDate: 'Födelsedatum', personalNumber: 'Personnummer', personalNumberHint: 'Används endast för denna ansökan om juridisk identitet.', nameReady: 'Namnet är klart' },
    address: { guidance: 'Adressvägledning', eyebrow: 'Adress', title: 'Låt Access göra adressökningen.', body: 'Börja med postnumret. Vi fyller i det vi kan och du kan justera allt innan du fortsätter.', find: 'Hitta din adress', findHint: 'Ange postnumret först så fyller vi i det vi kan.', looking: 'Söker efter din adress…', found: 'Adressuppgifter hittades — kontrollera och redigera dem nedan.', notFound: 'Vi hittade inte postnumret. Du kan ange adressen manuellt.', yourAddress: 'Din adress', selectCountry: 'Välj land', streetRequired: 'Gatuadress krävs', zipRequired: 'Postnummer krävs', numberRequired: 'Nummer krävs', neighborhoodRequired: 'Område krävs', cityRequired: 'Ort krävs', countryRequired: 'Land krävs' },
    review: { everythingRight: 'Allt stämmer', acceptFirst: 'Godkänn villkoren för att fortsätta', accountDescription: 'Dina verifierade kontaktuppgifter skyddar denna verifiering.', requested: 'Begärd verifiering', acceptTitle: 'Granska och godkänn', requestBody: 'Athletes and You begärde denna verifiering via Access. Genom att fortsätta bekräftar du att uppgifterna och bilderna är sanningsenliga och tillhör dig.', readTerms: 'Läs villkoren', consent: 'Jag har läst och godkänner villkoren för denna verifiering.', address: 'Adress', updateAddress: 'Uppdatera din adress', personal: 'Personuppgifter', updatePersonal: 'Uppdatera dina uppgifter', postalCode: 'Postnummer', street: 'Gatuadress', number: 'Nummer', unit: 'Lägenhet eller enhet (valfritt)', area: 'Område', city: 'Ort', fullLegalName: 'Fullständigt juridiskt namn', birthDate: 'Födelsedatum', personalNumber: 'Personnummer' },
    submission: { done: 'Klart', title: 'Allt är klart.', body: 'Din verifiering har skickats in. Du kan stänga sidan eller logga in när som helst för att följa ansökan.', next: 'Vad händer nu?', nextBody: 'Verifieringsteamet granskar din ansökan. Vi mejlar dig när granskningen är klar.', track: 'Följ din ansökan', trackBody: 'Logga in när du vill för att se status. Efter godkännande visar kontot hur du överför din identitet till Neuro Access-appen.', login: 'Logga in och se din status', loginHint: 'Använd e-postadressen och lösenordet du skapade i ansökan.', retry: 'Försök skicka igen', submitting: 'Skickar din verifiering…', failed: 'Det gick inte att slutföra inskickningen.', savedSecureLink: 'Dina uppgifter och bilder är sparade. Öppna Access via den säkra länken och försök igen.', savedRetry: 'Dina uppgifter och bilder är sparade. Försök igen om en stund.', reauthTitle: 'Fortsätt din verifiering', reauthBody: 'Bekräfta ditt lösenord för att fortsätta säkert.', passwordRejected: 'Lösenordet godkändes inte. Försök igen.', confirming: 'Bekräftar…', readyLabel: 'Redo att skicka in', readyTitle: 'Din verifiering är klar.', readyBody: 'Du har granskat dina uppgifter och godkänt villkoren. Skicka in när du är redo så startar granskningen.' },
    secureJourney: { contact: 'Kontakt', identity: 'Identitet', review: 'Granskning', autoSave: 'Dina framsteg sparas automatiskt.', orientation: 'Verifieringsöversikt', progress: 'Säkerhet, identitet, granskning', securing: 'Säkrar din verifiering…' },
  },
  fr: {
    common: { close: 'Fermer', cancel: 'Annuler', save: 'Enregistrer', continue: 'Continuer', password: 'Mot de passe', showPassword: 'Afficher le mot de passe', hidePassword: 'Masquer le mot de passe', saving: 'Enregistrement sécurisé…', saved: 'Enregistré en toute sécurité' },
    about: { eyebrow: 'Données d’identité', title: 'Une correspondance précise commence par des données exactes.', compact: 'Reproduisez exactement votre pièce d’identité.', body: 'Saisissez les données exactement comme sur votre document. Vous pourrez les vérifier et les modifier avant l’envoi.', legalName: 'Nom légal', birthDate: 'Date de naissance', personalNumber: 'Numéro personnel', personalNumberHint: 'Utilisé uniquement pour cette demande d’identité légale.', nameReady: 'Nom valide' },
    address: { guidance: 'Aide pour l’adresse', eyebrow: 'Adresse', title: 'Laissez Access rechercher votre adresse.', body: 'Commencez par le code postal. Nous remplirons les données disponibles et vous pourrez tout corriger.', find: 'Trouver votre adresse', findHint: 'Saisissez d’abord votre code postal.', looking: 'Recherche de votre adresse…', found: 'Adresse trouvée — vérifiez et modifiez les données ci-dessous.', notFound: 'Code introuvable. Vous pouvez saisir l’adresse manuellement.', yourAddress: 'Votre adresse', selectCountry: 'Sélectionnez un pays', streetRequired: 'L’adresse est obligatoire', zipRequired: 'Le code postal est obligatoire', numberRequired: 'Le numéro est obligatoire', neighborhoodRequired: 'La zone est obligatoire', cityRequired: 'La ville est obligatoire', countryRequired: 'Le pays est obligatoire' },
    review: { everythingRight: 'Tout est correct', acceptFirst: 'Acceptez les conditions pour continuer', accountDescription: 'Vos coordonnées vérifiées protègent cette vérification.', requested: 'Vérification demandée', acceptTitle: 'Vérifier et accepter', requestBody: 'Athletes and You a demandé cette vérification via Access. En continuant, vous confirmez que vos données et photos sont exactes et vous appartiennent.', readTerms: 'Lire les conditions', consent: 'J’ai lu et j’accepte les conditions de cette vérification.', address: 'Adresse', updateAddress: 'Modifier votre adresse', personal: 'Données personnelles', updatePersonal: 'Modifier vos données', postalCode: 'Code postal', street: 'Adresse', number: 'Numéro', unit: 'Appartement ou unité (facultatif)', area: 'Zone', city: 'Ville', fullLegalName: 'Nom légal complet', birthDate: 'Date de naissance', personalNumber: 'Numéro personnel' },
    submission: { done: 'Terminé', title: 'Tout est prêt.', body: 'Votre vérification a bien été envoyée. Fermez cette page ou connectez-vous à tout moment pour suivre votre demande.', next: 'Et maintenant ?', nextBody: 'L’équipe vérifiera votre demande. Nous vous enverrons un e-mail lorsque l’examen sera terminé.', track: 'Suivre votre demande', trackBody: 'Connectez-vous à tout moment pour consulter le statut. Après approbation, votre compte indiquera comment transférer votre identité vers l’application Neuro Access.', login: 'Se connecter pour voir le statut', loginHint: 'Utilisez l’e-mail et le mot de passe créés pendant cette demande.', retry: 'Réessayer l’envoi', submitting: 'Envoi de votre vérification…', failed: 'Impossible de terminer l’envoi.', savedSecureLink: 'Vos données et photos sont enregistrées. Ouvrez Access avec son lien sécurisé et réessayez.', savedRetry: 'Vos données et photos sont enregistrées. Réessayez dans un instant.', reauthTitle: 'Continuer votre vérification', reauthBody: 'Pour votre sécurité, confirmez votre mot de passe.', passwordRejected: 'Ce mot de passe a été refusé. Réessayez.', confirming: 'Confirmation…' },
    secureJourney: { contact: 'Contact', identity: 'Identité', review: 'Vérification', autoSave: 'Votre progression est enregistrée automatiquement.', orientation: 'Aperçu de la vérification', progress: 'Sécurité, identité, vérification', securing: 'Sécurisation de votre vérification…' },
  },
  es: {
    common: { close: 'Cerrar', cancel: 'Cancelar', save: 'Guardar cambios', continue: 'Continuar', password: 'Contraseña', showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña', saving: 'Guardando de forma segura…', saved: 'Guardado de forma segura' },
    about: { eyebrow: 'Datos de identidad', title: 'Una coincidencia precisa empieza con datos exactos.', compact: 'Haz que coincidan exactamente con tu documento.', body: 'Introduce los datos tal como aparecen en tu documento. Podrás revisarlos y editarlos antes de enviar.', legalName: 'Nombre legal', birthDate: 'Fecha de nacimiento', personalNumber: 'Número personal', personalNumberHint: 'Se utiliza solo para esta solicitud de identidad legal.', nameReady: 'Nombre válido' },
    address: { guidance: 'Ayuda con la dirección', eyebrow: 'Dirección', title: 'Deja que Access busque tu dirección.', body: 'Empieza por el código postal. Completaremos lo posible y podrás corregirlo antes de continuar.', find: 'Encuentra tu dirección', findHint: 'Introduce primero el código postal.', looking: 'Buscando tu dirección…', found: 'Dirección encontrada: comprueba y edita los datos.', notFound: 'No encontramos ese código. Puedes introducir la dirección manualmente.', yourAddress: 'Tu dirección', selectCountry: 'Selecciona un país', streetRequired: 'La dirección es obligatoria', zipRequired: 'El código postal es obligatorio', numberRequired: 'El número es obligatorio', neighborhoodRequired: 'La zona es obligatoria', cityRequired: 'La ciudad es obligatoria', countryRequired: 'El país es obligatorio' },
    review: { everythingRight: 'Todo es correcto', acceptFirst: 'Acepta las condiciones para continuar', accountDescription: 'Tus datos de contacto verificados protegen esta verificación.', requested: 'Verificación solicitada', acceptTitle: 'Revisa y acepta', requestBody: 'Athletes and You solicitó esta verificación mediante Access. Al continuar, confirmas que tus datos y fotos son veraces y te pertenecen.', readTerms: 'Leer las condiciones', consent: 'He leído y acepto las condiciones de esta verificación.', address: 'Dirección', updateAddress: 'Actualiza tu dirección', personal: 'Datos personales', updatePersonal: 'Actualiza tus datos', postalCode: 'Código postal', street: 'Dirección', number: 'Número', unit: 'Piso o unidad (opcional)', area: 'Zona', city: 'Ciudad', fullLegalName: 'Nombre legal completo', birthDate: 'Fecha de nacimiento', personalNumber: 'Número personal' },
    submission: { done: 'Listo', title: 'Todo está preparado.', body: 'Tu verificación se ha enviado correctamente. Cierra esta página o inicia sesión cuando quieras para seguir tu solicitud.', next: '¿Qué ocurre ahora?', nextBody: 'El equipo revisará tu solicitud. Te enviaremos un correo cuando termine la revisión.', track: 'Sigue tu solicitud', trackBody: 'Inicia sesión cuando quieras para consultar el estado. Tras la aprobación, tu cuenta mostrará cómo transferir tu identidad a la app Neuro Access.', login: 'Iniciar sesión para ver el estado', loginHint: 'Usa el correo y la contraseña que creaste durante esta solicitud.', retry: 'Reintentar envío', submitting: 'Enviando tu verificación…', failed: 'No pudimos finalizar el envío.', savedSecureLink: 'Tus datos y fotos están guardados. Abre Access con su enlace seguro e inténtalo de nuevo.', savedRetry: 'Tus datos y fotos están guardados. Inténtalo de nuevo en un momento.', reauthTitle: 'Continúa tu verificación', reauthBody: 'Por seguridad, confirma tu contraseña.', passwordRejected: 'La contraseña no se ha aceptado. Inténtalo de nuevo.', confirming: 'Confirmando…' },
    secureJourney: { contact: 'Contacto', identity: 'Identidad', review: 'Revisión', autoSave: 'Tu progreso se guarda automáticamente.', orientation: 'Resumen de verificación', progress: 'Seguridad, identidad, revisión', securing: 'Protegiendo tu verificación…' },
  },
  pt: {
    common: { close: 'Fechar', cancel: 'Cancelar', save: 'Salvar alterações', continue: 'Continuar', password: 'Senha', showPassword: 'Mostrar senha', hidePassword: 'Ocultar senha', saving: 'Salvando com segurança…', saved: 'Salvo com segurança' },
    about: { eyebrow: 'Dados de identidade', title: 'Uma correspondência precisa começa com dados exatos.', compact: 'Preencha exatamente como no documento.', body: 'Informe os dados exatamente como aparecem no documento. Você poderá revisar e editar antes do envio.', legalName: 'Nome legal', birthDate: 'Data de nascimento', personalNumber: 'Número pessoal', personalNumberHint: 'Usado somente nesta solicitação de identidade legal.', nameReady: 'Nome válido' },
    address: { guidance: 'Orientação de endereço', eyebrow: 'Endereço', title: 'Deixe a Access localizar seu endereço.', body: 'Comece pelo CEP. Preencheremos o que for possível e você poderá ajustar tudo.', find: 'Encontre seu endereço', findHint: 'Informe primeiro o CEP.', looking: 'Buscando seu endereço…', found: 'Endereço encontrado — confira e edite os dados abaixo.', notFound: 'Não encontramos esse código. Você pode preencher o endereço manualmente.', yourAddress: 'Seu endereço', selectCountry: 'Selecione o país', streetRequired: 'O endereço é obrigatório', zipRequired: 'O CEP é obrigatório', numberRequired: 'O número é obrigatório', neighborhoodRequired: 'O bairro é obrigatório', cityRequired: 'A cidade é obrigatória', countryRequired: 'O país é obrigatório' },
    review: { everythingRight: 'Tudo está correto', acceptFirst: 'Aceite os termos para continuar', accountDescription: 'Seus contatos verificados protegem esta verificação.', requested: 'Verificação solicitada', acceptTitle: 'Revise e aceite', requestBody: 'Athletes and You solicitou esta verificação pela Access. Ao continuar, você confirma que seus dados e fotos são verdadeiros e pertencem a você.', readTerms: 'Ler os termos', consent: 'Li e aceito os termos desta verificação.', address: 'Endereço', updateAddress: 'Atualize seu endereço', personal: 'Dados pessoais', updatePersonal: 'Atualize seus dados', postalCode: 'CEP', street: 'Endereço', number: 'Número', unit: 'Apartamento ou unidade (opcional)', area: 'Bairro', city: 'Cidade', fullLegalName: 'Nome legal completo', birthDate: 'Data de nascimento', personalNumber: 'Número pessoal' },
    submission: { done: 'Concluído', title: 'Tudo pronto.', body: 'Sua verificação foi enviada. Feche esta página ou entre quando quiser para acompanhar a solicitação.', next: 'O que acontece agora?', nextBody: 'A equipe analisará sua solicitação. Enviaremos um e-mail quando a análise terminar.', track: 'Acompanhe sua solicitação', trackBody: 'Entre quando quiser para consultar o status. Após a aprovação, sua conta mostrará como transferir sua identidade para o app Neuro Access.', login: 'Entrar para ver o status', loginHint: 'Use o e-mail e a senha criados durante esta solicitação.', retry: 'Tentar enviar novamente', submitting: 'Enviando sua verificação…', failed: 'Não foi possível concluir o envio.', savedSecureLink: 'Seus dados e fotos estão salvos. Abra a Access pelo link seguro e tente novamente.', savedRetry: 'Seus dados e fotos estão salvos. Tente novamente em instantes.', reauthTitle: 'Continue sua verificação', reauthBody: 'Por segurança, confirme sua senha.', passwordRejected: 'A senha não foi aceita. Tente novamente.', confirming: 'Confirmando…' },
    secureJourney: { contact: 'Contato', identity: 'Identidade', review: 'Revisão', autoSave: 'Seu progresso é salvo automaticamente.', orientation: 'Resumo da verificação', progress: 'Segurança, identidade, revisão', securing: 'Protegendo sua verificação…' },
  },
  ar: {
    common: { close: 'إغلاق', cancel: 'إلغاء', save: 'حفظ التغييرات', continue: 'متابعة', password: 'كلمة المرور', showPassword: 'إظهار كلمة المرور', hidePassword: 'إخفاء كلمة المرور', saving: 'جارٍ الحفظ بأمان…', saved: 'تم الحفظ بأمان' },
    about: { eyebrow: 'بيانات الهوية', title: 'تبدأ المطابقة الدقيقة ببيانات صحيحة.', compact: 'طابق وثيقة هويتك تمامًا.', body: 'أدخل البيانات تمامًا كما تظهر في وثيقتك. يمكنك مراجعتها وتعديلها قبل الإرسال.', legalName: 'الاسم القانوني', birthDate: 'تاريخ الميلاد', personalNumber: 'الرقم الشخصي', personalNumberHint: 'يُستخدم فقط لطلب الهوية القانونية هذا.', nameReady: 'الاسم جاهز' },
    address: { guidance: 'إرشادات العنوان', eyebrow: 'العنوان', title: 'دع Access يبحث عن عنوانك.', body: 'ابدأ بالرمز البريدي. سنملأ ما نستطيع ويمكنك تعديل كل شيء قبل المتابعة.', find: 'ابحث عن عنوانك', findHint: 'أدخل الرمز البريدي أولاً.', looking: 'جارٍ البحث عن عنوانك…', found: 'تم العثور على العنوان — راجع البيانات وعدّلها أدناه.', notFound: 'لم نعثر على هذا الرمز. يمكنك إدخال العنوان يدويًا.', yourAddress: 'عنوانك', selectCountry: 'اختر البلد', streetRequired: 'عنوان الشارع مطلوب', zipRequired: 'الرمز البريدي مطلوب', numberRequired: 'الرقم مطلوب', neighborhoodRequired: 'المنطقة مطلوبة', cityRequired: 'المدينة مطلوبة', countryRequired: 'البلد مطلوب' },
    review: { everythingRight: 'كل شيء صحيح', acceptFirst: 'وافق على الشروط للمتابعة', accountDescription: 'تحمي بيانات اتصالك الموثقة عملية التحقق هذه.', requested: 'عملية التحقق المطلوبة', acceptTitle: 'راجع ووافق', requestBody: 'طلبت Athletes and You عملية التحقق هذه عبر Access. بالمتابعة، تؤكد أن بياناتك وصورك صحيحة وتخصك.', readTerms: 'قراءة الشروط', consent: 'قرأت شروط عملية التحقق هذه وأوافق عليها.', address: 'العنوان', updateAddress: 'تحديث عنوانك', personal: 'البيانات الشخصية', updatePersonal: 'تحديث بياناتك', postalCode: 'الرمز البريدي', street: 'عنوان الشارع', number: 'الرقم', unit: 'الشقة أو الوحدة (اختياري)', area: 'المنطقة', city: 'المدينة', fullLegalName: 'الاسم القانوني الكامل', birthDate: 'تاريخ الميلاد', personalNumber: 'الرقم الشخصي' },
    submission: { done: 'تم', title: 'أصبحت جاهزًا.', body: 'تم إرسال عملية التحقق بنجاح. يمكنك إغلاق الصفحة أو تسجيل الدخول في أي وقت لمتابعة طلبك.', next: 'ماذا سيحدث الآن؟', nextBody: 'سيراجع فريق التحقق طلبك. سنرسل إليك بريدًا إلكترونيًا عند اكتمال المراجعة.', track: 'تابع طلبك', trackBody: 'سجّل الدخول متى شئت لمعرفة الحالة. بعد الموافقة، سيوضح حسابك كيفية نقل هويتك إلى تطبيق Neuro Access.', login: 'تسجيل الدخول لمعرفة الحالة', loginHint: 'استخدم البريد الإلكتروني وكلمة المرور اللذين أنشأتهما أثناء هذا الطلب.', retry: 'إعادة محاولة الإرسال', submitting: 'جارٍ إرسال عملية التحقق…', failed: 'تعذر إكمال الإرسال.', savedSecureLink: 'بياناتك وصورك محفوظة. افتح Access عبر الرابط الآمن وحاول مجددًا.', savedRetry: 'بياناتك وصورك محفوظة. حاول مجددًا بعد قليل.', reauthTitle: 'تابع عملية التحقق', reauthBody: 'لحمايتك، أكّد كلمة المرور للمتابعة.', passwordRejected: 'لم تُقبل كلمة المرور. حاول مجددًا.', confirming: 'جارٍ التأكيد…' },
    secureJourney: { contact: 'بيانات الاتصال', identity: 'الهوية', review: 'المراجعة', autoSave: 'يُحفظ تقدمك تلقائيًا.', orientation: 'نظرة عامة على التحقق', progress: 'الأمان، الهوية، المراجعة', securing: 'جارٍ تأمين عملية التحقق…' },
  },
}

Object.entries(launchUiCopy).forEach(([language, copy]) => {
  content[language].access.launch = copy
})

const captureShellCopy = {
  en: { clearSelfie: 'One clear, natural selfie', selfieHint: 'No filters, screenshots, or glare. You review it before it is used.', useCamera: 'Use camera', bestQuality: 'Best quality', choosePhoto: 'Choose a photo', formats: 'JPG, PNG, or WebP', encrypted: 'Your image is encrypted and used only for this verification.', takeSelfie: 'Take a selfie', imageOnly: 'Choose an image file.', tooLarge: 'This photo is too large to save. Please choose a smaller image.', front: 'Front of your ID', back: 'Back of your ID', progress: 'Identity photo progress', frontShort: 'Front', backShort: 'Back', selfie: 'Selfie', current: 'Current task', next: 'Up next', available: 'Available', cameraDenied: 'Camera access is off', cameraDeniedHint: 'Allow camera access for your browser, then try again. You can also choose a photo instead.', cameraUnavailable: 'Camera unavailable', cameraErrorHint: 'We could not start the camera. Try again or choose a photo instead.', tryAgain: 'Try again', closeCamera: 'Close camera', switchCamera: 'Switch camera', shutter: 'Capture photo', previewAlt: 'Captured preview', retake: 'Retake', done: 'Done', captured: 'Got it', tapAnytime: 'Tap anytime', coachUnavailable: 'Automatic guidance is unavailable. You can still take the photo.', faceFrame: 'Keep your face inside the oval', idFrame: 'Keep all four edges of your ID inside the frame', selfieQuality: 'Good light · no filters · you stay in control', documentQuality: 'Good light · no glare · every detail visible', preparing: 'Preparing camera', permission: 'Camera access required', taking: 'Taking photo', photoCaptured: 'Photo captured', saving: 'Saving securely', saved: 'Photo saved securely', ready: 'Camera ready', saveFailed: 'We couldn’t save this photo. Try again.' },
  sv: { clearSelfie: 'En tydlig och naturlig selfie', selfieHint: 'Inga filter, skärmbilder eller reflexer. Du granskar bilden innan den används.', useCamera: 'Använd kameran', bestQuality: 'Bäst kvalitet', choosePhoto: 'Välj en bild', formats: 'JPG, PNG eller WebP', encrypted: 'Bilden krypteras och används endast för denna verifiering.', takeSelfie: 'Ta en selfie', imageOnly: 'Välj en bildfil.', tooLarge: 'Bilden är för stor för att sparas. Välj en mindre bild.', front: 'Framsidan av din ID-handling', back: 'Baksidan av din ID-handling', progress: 'Förlopp för identitetsbilder', frontShort: 'Framsida', backShort: 'Baksida', selfie: 'Selfie', current: 'Aktuellt steg', next: 'Nästa steg', available: 'Tillgängligt', cameraDenied: 'Kameraåtkomst är avstängd', cameraDeniedHint: 'Tillåt kameraåtkomst i webbläsaren och försök igen, eller välj en bild.', cameraUnavailable: 'Kameran är inte tillgänglig', cameraErrorHint: 'Kameran kunde inte startas. Försök igen eller välj en bild.', tryAgain: 'Försök igen', closeCamera: 'Stäng kameran', switchCamera: 'Byt kamera', shutter: 'Ta foto', previewAlt: 'Förhandsvisning', retake: 'Ta om', done: 'Klar', captured: 'Klart', tapAnytime: 'Tryck när du vill', coachUnavailable: 'Automatisk vägledning saknas. Du kan ändå ta bilden.', faceFrame: 'Håll ansiktet inuti ovalen', idFrame: 'Håll ID-handlingens alla kanter i ramen', selfieQuality: 'Bra ljus · inga filter · du har kontroll', documentQuality: 'Bra ljus · inga reflexer · alla detaljer syns', preparing: 'Förbereder kameran', permission: 'Kameraåtkomst krävs', taking: 'Tar bilden', photoCaptured: 'Bilden är tagen', saving: 'Sparar säkert', saved: 'Bilden har sparats säkert', ready: 'Kameran är klar', saveFailed: 'Bilden kunde inte sparas. Försök igen.' },
  fr: { clearSelfie: 'Un selfie naturel et net', selfieHint: 'Sans filtre, capture d’écran ni reflet. Vous le vérifiez avant utilisation.', useCamera: 'Utiliser la caméra', bestQuality: 'Meilleure qualité', choosePhoto: 'Choisir une photo', formats: 'JPG, PNG ou WebP', encrypted: 'Votre image est chiffrée et utilisée uniquement pour cette vérification.', takeSelfie: 'Prendre un selfie', imageOnly: 'Choisissez un fichier image.', tooLarge: 'Cette photo est trop volumineuse. Choisissez une image plus petite.', front: 'Recto de votre pièce d’identité', back: 'Verso de votre pièce d’identité', progress: 'Progression des photos d’identité', frontShort: 'Recto', backShort: 'Verso', selfie: 'Selfie', current: 'Étape actuelle', next: 'Étape suivante', available: 'Disponible', cameraDenied: 'Accès à la caméra désactivé', cameraDeniedHint: 'Autorisez la caméra dans votre navigateur, puis réessayez, ou choisissez une photo.', cameraUnavailable: 'Caméra indisponible', cameraErrorHint: 'Impossible de démarrer la caméra. Réessayez ou choisissez une photo.', tryAgain: 'Réessayer', closeCamera: 'Fermer la caméra', switchCamera: 'Changer de caméra', shutter: 'Prendre la photo', previewAlt: 'Aperçu de la photo', retake: 'Reprendre', done: 'Terminé', captured: 'Photo prise', tapAnytime: 'Appuyez quand vous voulez', coachUnavailable: 'Le guidage automatique est indisponible. Vous pouvez prendre la photo.', faceFrame: 'Gardez votre visage dans l’ovale', idFrame: 'Gardez les quatre bords du document dans le cadre', selfieQuality: 'Bonne lumière · aucun filtre · vous gardez le contrôle', documentQuality: 'Bonne lumière · aucun reflet · détails visibles', preparing: 'Préparation de la caméra', permission: 'Accès à la caméra requis', taking: 'Prise de la photo', photoCaptured: 'Photo prise', saving: 'Enregistrement sécurisé', saved: 'Photo enregistrée en toute sécurité', ready: 'Caméra prête', saveFailed: 'Impossible d’enregistrer cette photo. Réessayez.' },
  es: { clearSelfie: 'Un selfie natural y nítido', selfieHint: 'Sin filtros, capturas de pantalla ni reflejos. Lo revisarás antes de usarlo.', useCamera: 'Usar la cámara', bestQuality: 'Mejor calidad', choosePhoto: 'Elegir una foto', formats: 'JPG, PNG o WebP', encrypted: 'Tu imagen se cifra y se usa solo para esta verificación.', takeSelfie: 'Hazte un selfie', imageOnly: 'Elige un archivo de imagen.', tooLarge: 'La foto es demasiado grande. Elige una imagen más pequeña.', front: 'Anverso de tu documento', back: 'Reverso de tu documento', progress: 'Progreso de las fotos de identidad', frontShort: 'Anverso', backShort: 'Reverso', selfie: 'Selfie', current: 'Tarea actual', next: 'Siguiente tarea', available: 'Disponible', cameraDenied: 'El acceso a la cámara está desactivado', cameraDeniedHint: 'Permite la cámara en el navegador e inténtalo de nuevo, o elige una foto.', cameraUnavailable: 'Cámara no disponible', cameraErrorHint: 'No se pudo iniciar la cámara. Inténtalo de nuevo o elige una foto.', tryAgain: 'Intentar de nuevo', closeCamera: 'Cerrar cámara', switchCamera: 'Cambiar cámara', shutter: 'Hacer foto', previewAlt: 'Vista previa', retake: 'Repetir', done: 'Listo', captured: 'Capturado', tapAnytime: 'Pulsa cuando quieras', coachUnavailable: 'La guía automática no está disponible. Puedes hacer la foto.', faceFrame: 'Mantén el rostro dentro del óvalo', idFrame: 'Mantén los cuatro bordes del documento dentro del marco', selfieQuality: 'Buena luz · sin filtros · tú tienes el control', documentQuality: 'Buena luz · sin reflejos · todos los detalles visibles', preparing: 'Preparando la cámara', permission: 'Se necesita acceso a la cámara', taking: 'Haciendo la foto', photoCaptured: 'Foto capturada', saving: 'Guardando de forma segura', saved: 'Foto guardada de forma segura', ready: 'Cámara lista', saveFailed: 'No se pudo guardar la foto. Inténtalo de nuevo.' },
  pt: { clearSelfie: 'Uma selfie nítida e natural', selfieHint: 'Sem filtros, capturas de tela ou reflexos. Você revisa antes do uso.', useCamera: 'Usar câmera', bestQuality: 'Melhor qualidade', choosePhoto: 'Escolher foto', formats: 'JPG, PNG ou WebP', encrypted: 'Sua imagem é criptografada e usada somente nesta verificação.', takeSelfie: 'Tire uma selfie', imageOnly: 'Escolha um arquivo de imagem.', tooLarge: 'A foto é grande demais. Escolha uma imagem menor.', front: 'Frente do seu documento', back: 'Verso do seu documento', progress: 'Progresso das fotos de identidade', frontShort: 'Frente', backShort: 'Verso', selfie: 'Selfie', current: 'Etapa atual', next: 'Próxima etapa', available: 'Disponível', cameraDenied: 'O acesso à câmera está desativado', cameraDeniedHint: 'Permita a câmera no navegador e tente novamente, ou escolha uma foto.', cameraUnavailable: 'Câmera indisponível', cameraErrorHint: 'Não foi possível iniciar a câmera. Tente novamente ou escolha uma foto.', tryAgain: 'Tentar novamente', closeCamera: 'Fechar câmera', switchCamera: 'Trocar câmera', shutter: 'Tirar foto', previewAlt: 'Prévia da foto', retake: 'Tirar novamente', done: 'Concluído', captured: 'Capturado', tapAnytime: 'Toque quando quiser', coachUnavailable: 'A orientação automática está indisponível. Você ainda pode tirar a foto.', faceFrame: 'Mantenha o rosto dentro do oval', idFrame: 'Mantenha as quatro bordas do documento no quadro', selfieQuality: 'Boa luz · sem filtros · você mantém o controle', documentQuality: 'Boa luz · sem reflexos · todos os detalhes visíveis', preparing: 'Preparando a câmera', permission: 'Acesso à câmera necessário', taking: 'Tirando a foto', photoCaptured: 'Foto capturada', saving: 'Salvando com segurança', saved: 'Foto salva com segurança', ready: 'Câmera pronta', saveFailed: 'Não foi possível salvar a foto. Tente novamente.' },
  ar: { clearSelfie: 'صورة ذاتية طبيعية وواضحة', selfieHint: 'من دون مرشحات أو لقطات شاشة أو وهج. يمكنك مراجعتها قبل استخدامها.', useCamera: 'استخدام الكاميرا', bestQuality: 'أفضل جودة', choosePhoto: 'اختيار صورة', formats: 'JPG أو PNG أو WebP', encrypted: 'صورتك مشفرة ولا تُستخدم إلا في عملية التحقق هذه.', takeSelfie: 'التقط صورة ذاتية', imageOnly: 'اختر ملف صورة.', tooLarge: 'حجم الصورة كبير جدًا. اختر صورة أصغر.', front: 'الوجه الأمامي لوثيقة هويتك', back: 'الوجه الخلفي لوثيقة هويتك', progress: 'تقدم صور الهوية', frontShort: 'الأمام', backShort: 'الخلف', selfie: 'صورة ذاتية', current: 'المهمة الحالية', next: 'المهمة التالية', available: 'متاح', cameraDenied: 'الوصول إلى الكاميرا متوقف', cameraDeniedHint: 'اسمح للمتصفح باستخدام الكاميرا ثم حاول مجددًا، أو اختر صورة.', cameraUnavailable: 'الكاميرا غير متاحة', cameraErrorHint: 'تعذر تشغيل الكاميرا. حاول مجددًا أو اختر صورة.', tryAgain: 'حاول مجددًا', closeCamera: 'إغلاق الكاميرا', switchCamera: 'تبديل الكاميرا', shutter: 'التقاط صورة', previewAlt: 'معاينة الصورة', retake: 'إعادة الالتقاط', done: 'تم', captured: 'تم الالتقاط', tapAnytime: 'اضغط متى شئت', coachUnavailable: 'الإرشاد التلقائي غير متاح. لا يزال بإمكانك التقاط الصورة.', faceFrame: 'أبقِ وجهك داخل الشكل البيضاوي', idFrame: 'أبقِ حواف الوثيقة الأربع داخل الإطار', selfieQuality: 'إضاءة جيدة · بلا مرشحات · أنت المتحكم', documentQuality: 'إضاءة جيدة · بلا وهج · كل التفاصيل واضحة', preparing: 'جارٍ تجهيز الكاميرا', permission: 'يلزم السماح بالكاميرا', taking: 'جارٍ التقاط الصورة', photoCaptured: 'تم التقاط الصورة', saving: 'جارٍ الحفظ بأمان', saved: 'تم حفظ الصورة بأمان', ready: 'الكاميرا جاهزة', saveFailed: 'تعذر حفظ الصورة. حاول مجددًا.' },
}

Object.entries(captureShellCopy).forEach(([language, copy]) => {
  content[language].access.capture = copy
})

const navigationCopy = {
  en: { title: 'Identity verification', phases: { account: 'Secure your verification', details: 'About you', identity: 'Verify your identity', review: 'Review and submit' }, private: 'Private session', saved: 'Saved securely', saving: 'Saving securely', attention: 'Needs attention', retry: 'Try again', of: 'of', complete: 'complete', selectLanguage: 'Select language', chooseLanguage: 'Choose language', language: 'Language', actions: { 0: 'Send verification codes', 1: 'Verify phone', 2: 'Verify email', 3: 'Continue', 10: 'Choose document', 11: 'Use this photo', 12: 'Continue', 13: 'Use this photo', 14: 'Use this selfie', 15: 'Review information', 16: 'Review consent', 17: 'Submit verification' } },
  sv: { title: 'Identitetsverifiering', phases: { account: 'Säkra din verifiering', details: 'Om dig', identity: 'Verifiera din identitet', review: 'Granska och skicka in' }, private: 'Privat session', saved: 'Sparat säkert', saving: 'Sparar säkert', attention: 'Behöver åtgärdas', retry: 'Försök igen', of: 'av', complete: 'klart', selectLanguage: 'Välj språk', chooseLanguage: 'Välj språk', language: 'Språk', actions: { 0: 'Skicka verifieringskoder', 1: 'Verifiera telefon', 2: 'Verifiera e-post', 3: 'Fortsätt', 10: 'Välj dokument', 11: 'Använd bilden', 12: 'Fortsätt', 13: 'Använd bilden', 14: 'Använd selfien', 15: 'Granska uppgifterna', 16: 'Granska samtycket', 17: 'Skicka verifieringen' } },
  fr: { title: 'Vérification d’identité', phases: { account: 'Sécuriser la vérification', details: 'À propos de vous', identity: 'Vérifier votre identité', review: 'Vérifier et envoyer' }, private: 'Session privée', saved: 'Enregistré en sécurité', saving: 'Enregistrement sécurisé', attention: 'Action requise', retry: 'Réessayer', of: 'sur', complete: 'terminé', selectLanguage: 'Sélectionner la langue', chooseLanguage: 'Choisir la langue', language: 'Langue', actions: { 0: 'Envoyer les codes', 1: 'Vérifier le téléphone', 2: 'Vérifier l’e-mail', 3: 'Continuer', 10: 'Choisir le document', 11: 'Utiliser cette photo', 12: 'Continuer', 13: 'Utiliser cette photo', 14: 'Utiliser ce selfie', 15: 'Vérifier les données', 16: 'Vérifier le consentement', 17: 'Envoyer la vérification' } },
  es: { title: 'Verificación de identidad', phases: { account: 'Protege tu verificación', details: 'Sobre ti', identity: 'Verifica tu identidad', review: 'Revisa y envía' }, private: 'Sesión privada', saved: 'Guardado de forma segura', saving: 'Guardando de forma segura', attention: 'Requiere atención', retry: 'Intentar de nuevo', of: 'de', complete: 'completado', selectLanguage: 'Seleccionar idioma', chooseLanguage: 'Elegir idioma', language: 'Idioma', actions: { 0: 'Enviar códigos', 1: 'Verificar teléfono', 2: 'Verificar correo', 3: 'Continuar', 10: 'Elegir documento', 11: 'Usar esta foto', 12: 'Continuar', 13: 'Usar esta foto', 14: 'Usar este selfie', 15: 'Revisar datos', 16: 'Revisar consentimiento', 17: 'Enviar verificación' } },
  pt: { title: 'Verificação de identidade', phases: { account: 'Proteja sua verificação', details: 'Sobre você', identity: 'Verifique sua identidade', review: 'Revise e envie' }, private: 'Sessão privada', saved: 'Salvo com segurança', saving: 'Salvando com segurança', attention: 'Requer atenção', retry: 'Tentar novamente', of: 'de', complete: 'concluído', selectLanguage: 'Selecionar idioma', chooseLanguage: 'Escolher idioma', language: 'Idioma', actions: { 0: 'Enviar códigos', 1: 'Verificar celular', 2: 'Verificar e-mail', 3: 'Continuar', 10: 'Escolher documento', 11: 'Usar esta foto', 12: 'Continuar', 13: 'Usar esta foto', 14: 'Usar esta selfie', 15: 'Revisar dados', 16: 'Revisar consentimento', 17: 'Enviar verificação' } },
  ar: { title: 'التحقق من الهوية', phases: { account: 'تأمين عملية التحقق', details: 'معلومات عنك', identity: 'التحقق من هويتك', review: 'المراجعة والإرسال' }, private: 'جلسة خاصة', saved: 'تم الحفظ بأمان', saving: 'جارٍ الحفظ بأمان', attention: 'يتطلب الانتباه', retry: 'حاول مجددًا', of: 'من', complete: 'مكتمل', selectLanguage: 'اختيار اللغة', chooseLanguage: 'اختر اللغة', language: 'اللغة', actions: { 0: 'إرسال رموز التحقق', 1: 'التحقق من الهاتف', 2: 'التحقق من البريد', 3: 'متابعة', 10: 'اختيار الوثيقة', 11: 'استخدام هذه الصورة', 12: 'متابعة', 13: 'استخدام هذه الصورة', 14: 'استخدام الصورة الذاتية', 15: 'مراجعة البيانات', 16: 'مراجعة الموافقة', 17: 'إرسال التحقق' } },
}

Object.entries(navigationCopy).forEach(([language, copy]) => {
  content[language].access.navigation = copy
})

const verificationCopy = {
  en: { eyebrow: 'Verification', title: 'Confirm one channel, then keep moving.', durable: 'Your verified contact details stay attached to this journey.', confirmCode: 'Confirm the code we sent', recoveryHint: 'Needed only to deliver and verify this code after the page restarted. It is not saved in browser storage.', bothSides: 'Photos of both sides are required.', captureSaved: 'Got it — saved securely' },
  sv: { eyebrow: 'Verifiering', title: 'Bekräfta en kanal och fortsätt sedan.', durable: 'Dina verifierade kontaktuppgifter följer med i den här processen.', confirmCode: 'Bekräfta koden vi skickade', recoveryHint: 'Behövs bara för att skicka och verifiera koden efter att sidan startats om. Den sparas inte i webbläsaren.', bothSides: 'Bilder av båda sidor krävs.', captureSaved: 'Klart — sparat säkert' },
  fr: { eyebrow: 'Vérification', title: 'Confirmez un canal, puis continuez.', durable: 'Vos coordonnées vérifiées restent liées à ce parcours.', confirmCode: 'Confirmez le code envoyé', recoveryHint: 'Nécessaire uniquement pour envoyer et vérifier ce code après le redémarrage de la page. Il n’est pas conservé dans le navigateur.', bothSides: 'Les photos des deux faces sont obligatoires.', captureSaved: 'C’est fait — enregistré en sécurité' },
  es: { eyebrow: 'Verificación', title: 'Confirma un canal y continúa.', durable: 'Tus datos de contacto verificados permanecen vinculados a este proceso.', confirmCode: 'Confirma el código enviado', recoveryHint: 'Solo se necesita para enviar y verificar el código tras reiniciar la página. No se guarda en el navegador.', bothSides: 'Se necesitan fotos de ambos lados.', captureSaved: 'Listo — guardado de forma segura' },
  pt: { eyebrow: 'Verificação', title: 'Confirme um canal e continue.', durable: 'Seus contatos verificados permanecem vinculados a esta jornada.', confirmCode: 'Confirme o código enviado', recoveryHint: 'Necessário apenas para enviar e verificar o código após reiniciar a página. Não é salvo no navegador.', bothSides: 'São necessárias fotos dos dois lados.', captureSaved: 'Pronto — salvo com segurança' },
  ar: { eyebrow: 'التحقق', title: 'أكّد إحدى قنوات الاتصال ثم تابع.', durable: 'تبقى بيانات اتصالك الموثقة مرتبطة بهذه العملية.', confirmCode: 'أكّد الرمز الذي أرسلناه', recoveryHint: 'يلزم فقط لإرسال الرمز والتحقق منه بعد إعادة تشغيل الصفحة. ولا يُحفظ في المتصفح.', bothSides: 'يلزم تصوير جانبي الوثيقة.', captureSaved: 'تم — حُفظ بأمان' },
}

Object.entries(verificationCopy).forEach(([language, copy]) => {
  content[language].access.verification = copy
})

const verificationStatusCopy = {
  en: { verified: 'Verified', enterCode: 'Enter code', waiting: 'Waiting', phone: 'Phone', email: 'Email', selected: 'Selected' },
  sv: { verified: 'Verifierad', enterCode: 'Ange kod', waiting: 'Väntar', phone: 'Telefon', email: 'E-post', selected: 'Vald' },
  fr: { verified: 'Vérifié', enterCode: 'Saisir le code', waiting: 'En attente', phone: 'Téléphone', email: 'E-mail', selected: 'Sélectionné' },
  es: { verified: 'Verificado', enterCode: 'Introduce el código', waiting: 'En espera', phone: 'Teléfono', email: 'Correo', selected: 'Seleccionado' },
  pt: { verified: 'Verificado', enterCode: 'Digite o código', waiting: 'Aguardando', phone: 'Celular', email: 'E-mail', selected: 'Selecionado' },
  ar: { verified: 'تم التحقق', enterCode: 'أدخل الرمز', waiting: 'في الانتظار', phone: 'الهاتف', email: 'البريد الإلكتروني', selected: 'تم الاختيار' },
}
Object.entries(verificationStatusCopy).forEach(([language, copy]) => {
  content[language].access.verification = { ...content[language].access.verification, ...copy }
})

const chromeCopy = {
  en: { workspace: 'Identity workspace', workspaceBody: 'Review your status and securely bring your identity to the app.', logout: 'Log out', home: 'Access home', closeMenu: 'Close menu', loginAside: 'Your saved details stay connected to your Access account, so you can continue where you left off.', restoreTitle: 'We couldn’t restore your progress', trying: 'Trying again…', tryAgain: 'Try again', duplicateTitle: 'KYC already open', duplicateBody: 'This KYC application is already open in another tab. Close the other tab, then reopen this page to continue editing.', preparingTitle: 'Preparing your secure session', preparingBody: 'Restoring progress and loading your verification flow…' },
  sv: { workspace: 'Identitetsöversikt', workspaceBody: 'Se din status och överför din identitet säkert till appen.', logout: 'Logga ut', home: 'Access startsida', closeMenu: 'Stäng meny', loginAside: 'Dina sparade uppgifter är kopplade till ditt Access-konto så att du kan fortsätta där du slutade.', restoreTitle: 'Dina framsteg kunde inte återställas', trying: 'Försöker igen…', tryAgain: 'Försök igen', duplicateTitle: 'KYC är redan öppet', duplicateBody: 'Den här KYC-ansökan är redan öppen i en annan flik. Stäng den andra fliken och öppna sedan sidan igen.', preparingTitle: 'Förbereder din säkra session', preparingBody: 'Återställer framsteg och läser in verifieringen…' },
  fr: { workspace: 'Espace identité', workspaceBody: 'Consultez votre statut et transférez votre identité vers l’application en toute sécurité.', logout: 'Se déconnecter', home: 'Accueil Access', closeMenu: 'Fermer le menu', loginAside: 'Vos données enregistrées restent liées à votre compte Access afin de reprendre là où vous vous êtes arrêté.', restoreTitle: 'Impossible de restaurer votre progression', trying: 'Nouvelle tentative…', tryAgain: 'Réessayer', duplicateTitle: 'KYC déjà ouvert', duplicateBody: 'Cette demande KYC est déjà ouverte dans un autre onglet. Fermez cet onglet, puis rouvrez cette page.', preparingTitle: 'Préparation de votre session sécurisée', preparingBody: 'Restauration de votre progression et chargement de la vérification…' },
  es: { workspace: 'Espacio de identidad', workspaceBody: 'Consulta tu estado y lleva tu identidad a la app de forma segura.', logout: 'Cerrar sesión', home: 'Inicio de Access', closeMenu: 'Cerrar menú', loginAside: 'Tus datos guardados permanecen vinculados a tu cuenta de Access para que continúes donde lo dejaste.', restoreTitle: 'No pudimos restaurar tu progreso', trying: 'Intentándolo de nuevo…', tryAgain: 'Intentar de nuevo', duplicateTitle: 'KYC ya está abierto', duplicateBody: 'Esta solicitud KYC ya está abierta en otra pestaña. Cierra la otra pestaña y vuelve a abrir esta página.', preparingTitle: 'Preparando tu sesión segura', preparingBody: 'Restaurando tu progreso y cargando la verificación…' },
  pt: { workspace: 'Área de identidade', workspaceBody: 'Consulte seu status e leve sua identidade ao app com segurança.', logout: 'Sair', home: 'Início da Access', closeMenu: 'Fechar menu', loginAside: 'Seus dados salvos permanecem vinculados à sua conta Access para você continuar de onde parou.', restoreTitle: 'Não foi possível restaurar seu progresso', trying: 'Tentando novamente…', tryAgain: 'Tentar novamente', duplicateTitle: 'KYC já está aberto', duplicateBody: 'Esta solicitação KYC já está aberta em outra aba. Feche a outra aba e abra esta página novamente.', preparingTitle: 'Preparando sua sessão segura', preparingBody: 'Restaurando o progresso e carregando a verificação…' },
  ar: { workspace: 'مساحة الهوية', workspaceBody: 'راجع حالتك وانقل هويتك إلى التطبيق بأمان.', logout: 'تسجيل الخروج', home: 'صفحة Access الرئيسية', closeMenu: 'إغلاق القائمة', loginAside: 'تبقى بياناتك المحفوظة مرتبطة بحساب Access لتتابع من حيث توقفت.', restoreTitle: 'تعذر استعادة تقدمك', trying: 'جارٍ المحاولة مجددًا…', tryAgain: 'حاول مجددًا', duplicateTitle: 'عملية KYC مفتوحة بالفعل', duplicateBody: 'طلب KYC هذا مفتوح في علامة تبويب أخرى. أغلق علامة التبويب الأخرى ثم أعد فتح هذه الصفحة.', preparingTitle: 'جارٍ تجهيز جلستك الآمنة', preparingBody: 'جارٍ استعادة التقدم وتحميل خطوات التحقق…' },
}
Object.entries(chromeCopy).forEach(([language, copy]) => {
  content[language].access.chrome = copy
})

const brandCopy = {
  en: { requestedBy: 'Verification requested by', identity: 'Your Access identity', submitted: 'Submitted for verification', progress: 'Identity in progress', ready: 'Ready to begin' },
  sv: { requestedBy: 'Verifiering begärd av', identity: 'Din Access-identitet', submitted: 'Inskickad för verifiering', progress: 'Identiteten behandlas', ready: 'Redo att börja' },
  fr: { requestedBy: 'Vérification demandée par', identity: 'Votre identité Access', submitted: 'Envoyée pour vérification', progress: 'Identité en cours', ready: 'Prêt à commencer' },
  es: { requestedBy: 'Verificación solicitada por', identity: 'Tu identidad Access', submitted: 'Enviada para verificación', progress: 'Identidad en curso', ready: 'Listo para empezar' },
  pt: { requestedBy: 'Verificação solicitada por', identity: 'Sua identidade Access', submitted: 'Enviada para verificação', progress: 'Identidade em andamento', ready: 'Pronto para começar' },
  ar: { requestedBy: 'طلب التحقق من قِبل', identity: 'هويتك في Access', submitted: 'أُرسلت للتحقق', progress: 'الهوية قيد المعالجة', ready: 'جاهز للبدء' },
}
Object.entries(brandCopy).forEach(([language, copy]) => {
  content[language].access.brand = copy
})

const loginStateCopy = {
  en: { username: 'Email address', missing: { title: 'Required fields', message: 'Enter your email and password.' }, failed: { title: 'Login failed', invalid: 'Invalid credentials', userNameOrPassword: 'The email or password is incorrect.' } },
  sv: { username: 'E-postadress', missing: { title: 'Obligatoriska fält', message: 'Ange din e-postadress och ditt lösenord.' }, failed: { title: 'Inloggningen misslyckades', invalid: 'Felaktiga inloggningsuppgifter', userNameOrPassword: 'E-postadressen eller lösenordet är fel.' } },
  fr: { username: 'Adresse e-mail', missing: { title: 'Champs obligatoires', message: 'Saisissez votre e-mail et votre mot de passe.' }, failed: { title: 'Échec de la connexion', invalid: 'Identifiants incorrects', userNameOrPassword: 'L’adresse e-mail ou le mot de passe est incorrect.' } },
  es: { username: 'Correo electrónico', missing: { title: 'Campos obligatorios', message: 'Introduce tu correo y contraseña.' }, failed: { title: 'Error al iniciar sesión', invalid: 'Credenciales no válidas', userNameOrPassword: 'El correo o la contraseña son incorrectos.' } },
  pt: { username: 'Endereço de e-mail', missing: { title: 'Campos obrigatórios', message: 'Informe seu e-mail e sua senha.' }, failed: { title: 'Falha no login', invalid: 'Credenciais inválidas', userNameOrPassword: 'O e-mail ou a senha estão incorretos.' } },
  ar: { username: 'عنوان البريد الإلكتروني', missing: { title: 'حقول مطلوبة', message: 'أدخل بريدك الإلكتروني وكلمة المرور.' }, failed: { title: 'فشل تسجيل الدخول', invalid: 'بيانات الدخول غير صحيحة', userNameOrPassword: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' } },
}
Object.entries(loginStateCopy).forEach(([language, copy]) => {
  content[language].login = mergeTranslations(content[language].login, copy)
})

const themeCopy = {
  en: { light: 'Use light theme', dark: 'Use dark theme' },
  sv: { light: 'Använd ljust tema', dark: 'Använd mörkt tema' },
  fr: { light: 'Utiliser le thème clair', dark: 'Utiliser le thème sombre' },
  es: { light: 'Usar tema claro', dark: 'Usar tema oscuro' },
  pt: { light: 'Usar tema claro', dark: 'Usar tema escuro' },
  ar: { light: 'استخدام المظهر الفاتح', dark: 'استخدام المظهر الداكن' },
}
Object.entries(themeCopy).forEach(([language, copy]) => {
  content[language].access.theme = copy
})

const entryExperienceCopy = {
  en: { secureSession: 'Secure identity session', privacy: 'Privacy-first', privacyBody: 'Your information is encrypted and handled only for verification.', guided: 'Guided from start to finish', guidedBody: 'Clear steps, live saving, and a review before you submit.', tracking: 'Status you can return to', trackingBody: 'Sign in at any time to follow the review and transfer an approved identity.', loginEyebrow: 'Your secure identity account', loginTitle: 'Welcome back.', loginBody: 'Sign in to follow your application, continue a saved verification, or transfer an approved identity.', protected: 'Protected account access', protectedBody: 'Your password stays private and your session is encrypted.', progressTitle: 'Your identity journey', progressBody: 'Continue exactly where you stopped. Your latest verified progress is connected to this account.', stepSubmitted: 'Application submitted', stepReview: 'Identity review', stepTransfer: 'Transfer to Neuro Access', accountHint: 'Secure account · private session', newApplication: 'Need to verify a new identity?' },
  sv: { secureSession: 'Säker identitetssession', privacy: 'Integritet först', privacyBody: 'Dina uppgifter krypteras och hanteras endast för verifieringen.', guided: 'Vägledning från start till mål', guidedBody: 'Tydliga steg, löpande sparande och granskning före inskick.', tracking: 'Status du alltid kan återvända till', trackingBody: 'Logga in när du vill för att följa granskningen och överföra en godkänd identitet.', loginEyebrow: 'Ditt säkra identitetskonto', loginTitle: 'Välkommen tillbaka.', loginBody: 'Logga in för att följa ansökan, fortsätta en sparad verifiering eller överföra en godkänd identitet.', protected: 'Skyddad kontoåtkomst', protectedBody: 'Ditt lösenord förblir privat och sessionen är krypterad.', progressTitle: 'Din identitetsresa', progressBody: 'Fortsätt exakt där du slutade. Dina senaste verifierade framsteg är kopplade till kontot.', stepSubmitted: 'Ansökan inskickad', stepReview: 'Identitetsgranskning', stepTransfer: 'Överför till Neuro Access', accountHint: 'Säkert konto · privat session', newApplication: 'Behöver du verifiera en ny identitet?' },
  fr: { secureSession: 'Session d’identité sécurisée', privacy: 'Confidentialité prioritaire', privacyBody: 'Vos données sont chiffrées et traitées uniquement pour la vérification.', guided: 'Guidé du début à la fin', guidedBody: 'Étapes claires, enregistrement continu et contrôle avant l’envoi.', tracking: 'Un statut accessible à tout moment', trackingBody: 'Connectez-vous pour suivre l’examen et transférer une identité approuvée.', loginEyebrow: 'Votre compte d’identité sécurisé', loginTitle: 'Heureux de vous revoir.', loginBody: 'Connectez-vous pour suivre votre demande, reprendre une vérification ou transférer une identité approuvée.', protected: 'Accès au compte protégé', protectedBody: 'Votre mot de passe reste privé et votre session est chiffrée.', progressTitle: 'Votre parcours d’identité', progressBody: 'Reprenez exactement où vous vous êtes arrêté. Votre dernière progression vérifiée est liée à ce compte.', stepSubmitted: 'Demande envoyée', stepReview: 'Examen de l’identité', stepTransfer: 'Transfert vers Neuro Access', accountHint: 'Compte sécurisé · session privée', newApplication: 'Besoin de vérifier une nouvelle identité ?' },
  es: { secureSession: 'Sesión de identidad segura', privacy: 'Privacidad ante todo', privacyBody: 'Tus datos se cifran y solo se tratan para la verificación.', guided: 'Con guía de principio a fin', guidedBody: 'Pasos claros, guardado continuo y revisión antes del envío.', tracking: 'Un estado al que siempre puedes volver', trackingBody: 'Inicia sesión para seguir la revisión y transferir una identidad aprobada.', loginEyebrow: 'Tu cuenta de identidad segura', loginTitle: 'Te damos la bienvenida.', loginBody: 'Inicia sesión para seguir tu solicitud, continuar una verificación o transferir una identidad aprobada.', protected: 'Acceso protegido a la cuenta', protectedBody: 'Tu contraseña permanece privada y la sesión está cifrada.', progressTitle: 'Tu recorrido de identidad', progressBody: 'Continúa exactamente donde lo dejaste. Tu último progreso verificado está vinculado a esta cuenta.', stepSubmitted: 'Solicitud enviada', stepReview: 'Revisión de identidad', stepTransfer: 'Transferencia a Neuro Access', accountHint: 'Cuenta segura · sesión privada', newApplication: '¿Necesitas verificar una identidad nueva?' },
  pt: { secureSession: 'Sessão de identidade segura', privacy: 'Privacidade em primeiro lugar', privacyBody: 'Seus dados são criptografados e tratados somente para verificação.', guided: 'Orientação do início ao fim', guidedBody: 'Etapas claras, salvamento contínuo e revisão antes do envio.', tracking: 'Status disponível sempre que precisar', trackingBody: 'Entre para acompanhar a análise e transferir uma identidade aprovada.', loginEyebrow: 'Sua conta de identidade segura', loginTitle: 'Boas-vindas de volta.', loginBody: 'Entre para acompanhar sua solicitação, continuar uma verificação ou transferir uma identidade aprovada.', protected: 'Acesso protegido à conta', protectedBody: 'Sua senha permanece privada e sua sessão é criptografada.', progressTitle: 'Sua jornada de identidade', progressBody: 'Continue exatamente de onde parou. Seu progresso verificado está vinculado a esta conta.', stepSubmitted: 'Solicitação enviada', stepReview: 'Análise de identidade', stepTransfer: 'Transferência para Neuro Access', accountHint: 'Conta segura · sessão privada', newApplication: 'Precisa verificar uma nova identidade?' },
  ar: { secureSession: 'جلسة هوية آمنة', privacy: 'الخصوصية أولاً', privacyBody: 'بياناتك مشفرة ولا تُعالج إلا لغرض التحقق.', guided: 'إرشاد من البداية إلى النهاية', guidedBody: 'خطوات واضحة وحفظ مستمر ومراجعة قبل الإرسال.', tracking: 'حالة يمكنك الرجوع إليها دائمًا', trackingBody: 'سجّل الدخول لمتابعة المراجعة ونقل الهوية بعد الموافقة.', loginEyebrow: 'حساب هويتك الآمن', loginTitle: 'مرحبًا بعودتك.', loginBody: 'سجّل الدخول لمتابعة طلبك أو استكمال عملية محفوظة أو نقل هوية معتمدة.', protected: 'وصول محمي إلى الحساب', protectedBody: 'تظل كلمة مرورك خاصة وجلستك مشفرة.', progressTitle: 'رحلة هويتك', progressBody: 'تابع تمامًا من حيث توقفت. آخر تقدم موثق مرتبط بهذا الحساب.', stepSubmitted: 'تم إرسال الطلب', stepReview: 'مراجعة الهوية', stepTransfer: 'النقل إلى Neuro Access', accountHint: 'حساب آمن · جلسة خاصة', newApplication: 'هل تحتاج إلى التحقق من هوية جديدة؟' },
}
Object.entries(entryExperienceCopy).forEach(([language, copy]) => {
  content[language].access.entry = copy
})

const verificationUnavailableCopy = {
  en: 'The verification service could not complete the request. Please try again later.',
  sv: 'Verifieringstjänsten kunde inte slutföra begäran. Försök igen senare.',
  fr: 'Le service de vérification n’a pas pu terminer la demande. Réessayez plus tard.',
  es: 'El servicio de verificación no pudo completar la solicitud. Inténtalo de nuevo más tarde.',
  pt: 'O serviço de verificação não conseguiu concluir a solicitação. Tente novamente mais tarde.',
  ar: 'تعذّر على خدمة التحقق إكمال الطلب. يُرجى المحاولة لاحقًا.',
}
Object.entries(verificationUnavailableCopy).forEach(([language, message]) => {
  content[language].errors.verificationUnavailable = message
})

// --- Create the context ---
const LanguageContext = createContext()

// --- Provider wrapper ---
export const LanguageProvider = ({ children }) => {
  // Match the server's first render, then read the saved or browser language.
  const [language, setLanguageState] = useState('en');

  React.useEffect(() => {
    let saved = null
    try {
      saved = window.localStorage.getItem('access-language')
    } catch {
      // Language selection still works when browser storage is disabled.
    }
    if (LANGUAGES.some(({ code }) => code === saved)) {
      setLanguageState(saved)
      return
    }
    const lang = (window.navigator.language || window.navigator.userLanguage || '').toLowerCase()
    const detected = LANGUAGES.find(({ code }) => lang === code || lang.startsWith(`${code}-`))
    if (detected) setLanguageState(detected.code)
  }, [])

  React.useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  const setLanguage = (nextLanguage) => {
    setLanguageState((current) => {
      const next = typeof nextLanguage === 'function' ? nextLanguage(current) : nextLanguage
      if (!LANGUAGES.some(({ code }) => code === next)) return current
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('access-language', next)
        document.documentElement.lang = next
        document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
      }
      return next
    })
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'pt' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

// --- Custom hook ---
export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context)
    throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
