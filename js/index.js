const firebaseConfig = firebase.initializeApp({
  apiKey: 'AIzaSyBR0io-r_snZTWy1pe8A0dsb4awBpANDxs',
  authDomain: 'escala-pnae.firebaseapp.com',
  databaseURL: 'https://escala-pnae-default-rtdb.firebaseio.com',
  projectId: 'escala-pnae',
  storageBucket: 'escala-pnae.firebasestorage.app',
  messagingSenderId: '289230851590',
  appId: '1:289230851590:web:a638d6c6a8409d65803d87'
})

var database = firebase.database()

function getSPTime() {
  const now = new Date()
  const options = {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  const formatter = new Intl.DateTimeFormat('pt-BR', options)
  const parts = formatter.formatToParts(now)

  const year = parts.find(part => part.type === 'year').value
  const month = parts.find(part => part.type === 'month').value - 1 // mês em JavaScript é 0-indexado
  const day = parts.find(part => part.type === 'day').value
  const hour = parts.find(part => part.type === 'hour').value
  const minute = parts.find(part => part.type === 'minute').value
  const second = parts.find(part => part.type === 'second').value

  return new Date(year, month, day, hour, minute, second)
}

/////////////////////////////////////////////////////////////////
//////////////////////////LOGINAREA//////////////////////////////

const names = ['Dias', 'Pamela', 'Joao', 'Cesar', 'Zaman'] // Lista de nomes permitidos
let SENHA_LOGIN = '25137'
let login = document.getElementById('login')
let allEscalas = document.getElementById('allEscalas')
let btnLogin = document.getElementById('btnLogin')
let lbIncorrect = document.getElementById('lbIncorrect')

let inptUser = document.getElementById('inptUser')
let inptPassword = document.getElementById('inptPassword')

btnLogin.addEventListener('click', e => {
  e.preventDefault()

  const username = inptUser.value.trim()
  const password = inptPassword.value

  if (password === SENHA_LOGIN) {
    if (username !== '') {
      if (names.includes(username)) {
        checkAndCreateUser(username)
      } else {
        console.log('Nome de usuário não permitido.')
        lbIncorrect.textContent = 'Nome de usuário não permitido!'

        setTimeout(function () {
          lbIncorrect.textContent = ''
        }, 1000)
      }
    }
  } else {
    console.log('Senha incorreta')
    lbIncorrect.textContent = 'Senha não permitida!'

    setTimeout(function () {
      lbIncorrect.textContent = ''
    }, 1000)
  }
})

let actualLogin = ''
let actualScale = ''
//-OOVupIf0JfBij2S-3AP

/////////////////////////////////////////////////////////////////
//////////////////////////FIREBASE USER HANDLING/////////////////

function checkAndCreateUser(username) {
  const usersRef = database.ref('Users')

  usersRef.child(username).once('value', snapshot => {
    if (snapshot.exists()) {
      console.log('Usuário já existe:', username)
      actualLogin = username
      login.classList.add('hidden')
      allEscalas.classList.remove('hidden')
      loadEscalas()
    } else {
      usersRef
        .child(username)
        .set({
          name: username
        })
        .then(() => {
          console.log('Novo usuário criado:', username)
          actualLogin = username
          login.classList.add('hidden')
          allEscalas.classList.remove('hidden')
          loadEscalas()
        })
        .catch(error => {
          console.error('Erro ao criar usuário:', error)
        })
    }
  })
}

/////////////////////////////////////////////////////////////////
////////////////////////////ESCALAS CREATE///////////////////////

let Scales
let nameEscala = document.getElementById('nameEscala')

// Função para criar nova escala no Firebase
function createNewEscala() {
  const userActual = actualLogin

  console.log('macaco')

  // Verifica se há usuário logado
  if (!userActual) {
    console.error('Nenhum usuário logado!')
    alert('Você precisa estar logado para criar uma escala!')
    return
  }

  // Referência para o nó do usuário Dias
  const diasRef = database.ref(`Users/${actualLogin}`)

  // Cria um novo nó de escala com um ID único
  const newScaleRef = diasRef.child('Escalas').push()

  // Dados da nova escala
  const newScaleData = {
    name: 'Nova Escala',
    createdBy: userActual, // ou userActual.email, dependendo do que você tem
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    peoples: {}, // Objeto vazio para ser preenchido depois
    rules: {}
  }

  // Salva no Firebase
  newScaleRef
    .set(newScaleData)
    .then(() => {
      console.log('Nova escala criada com sucesso!')

      // Opcional: Atualiza a interface ou redireciona
      loadEscalas() // Se você tiver uma função para carregar as escalas
    })
    .catch(error => {
      console.error('Erro ao criar escala:', error)
      alert('Erro ao criar escala: ' + error.message)
    })
}

function loadEscalas() {
  const listEscalas = document.getElementById('listEscalas')
  listEscalas.innerHTML = ''

  const escalasRef = database.ref(`Users/${actualLogin}/Escalas`)

  escalasRef.once('value').then(snapshot => {
    const escalasData = snapshot.val()

    if (!escalasData) {
      listEscalas.innerHTML = '<p>Nenhuma escala encontrada.</p>'
      setTimeout(function () {
        listEscalas.innerHTML = ''
      }, 1000)
      return
    }

    // Cria as escalas na interface
    Object.keys(escalasData).forEach(escalaId => {
      const escala = escalasData[escalaId]

      const escalaDiv = document.createElement('div')
      escalaDiv.className = 'Escala'
      escalaDiv.value = escalaId // Armazena o ID no value

      const title = document.createElement('h2')
      title.textContent = escala.name // Mostra o nome no texto

      escalaDiv.appendChild(title)
      listEscalas.appendChild(escalaDiv)
    })

    // Configura os event listeners
    setupScaleClickListeners()
  })
}

loadEscalas()

function setupScaleClickListeners() {
  const Scales = document.querySelectorAll('.Escala')

  Scales.forEach(Scale => {
    Scale.addEventListener('click', function () {
      const escalaId = this.value // Pega o ID do value

      EscalaShow.classList.remove('hidden')
      allEscalas.classList.add('hidden')

      // Busca diretamente pelo ID
      actualScale = escalaId
      peoplesPDF.innerHTML = ''
      peoples = ''
      loadPeoplesFromEscala(escalaId)
      createPeoplesPDF()
      loadPeoplesFromDatabase()

      loadEscala()
    })
  })
}

function loadPeoplesFromEscala(escalaId) {
  const database = firebase.database()
  const escalaRef = database.ref(`Users/${actualLogin}/Escalas/${escalaId}`)

  escalaRef.once('value').then(snapshot => {
    const escala = snapshot.val()

    nameEscala.textContent = escala.name
  })
}

function loadPeoplesFromDatabase() {
  if (!actualScale) {
    console.error('Nenhuma escala selecionada!')
    return
  }

  const db = firebase.database()
  const ref = db.ref(`Users/${actualLogin}/Escalas/${actualScale}/peoples`)

  ref.once(
    'value',
    function (snapshot) {
      const peoplesData = snapshot.val()

      if (peoplesData) {
        Object.keys(peoplesData).forEach(matricula => {
          if (!peoplesData[matricula].Folgas) {
            peoplesData[matricula].Folgas = []
          }

          const defaults = {
            Folga: false,
            Double: false,
            Holiday: false,
            Docket: false,
            Additionals: {}
          }

          peoplesData[matricula] = { ...defaults, ...peoplesData[matricula] }
        })

        peoples = peoplesData
        console.log('Dados carregados:', peoples)
        updateAndSavePeoples()

        createPeoplesPDF()
      } else {
        console.log('Nenhum dado encontrado')
        peoples = {}
      }
    },
    function (error) {
      console.error('Erro ao carregar:', error)
    }
  )
}

document.addEventListener('keydown', function (event) {
  // if (event.key === 'P' || event.key === 'p') {
  //event.preventDefault()
  // loadEscalas()
  //}
})

// Configura o evento de clique no botão
const btnCreateEscalas = document.getElementById('btnCreateEscalas')
btnCreateEscalas.addEventListener('click', function () {
  createNewEscala()
})

/////////////////////////////////////////////////////////////////
////////////////////////////ESCALAS PNAE/////////////////////////

let logout = document.getElementById('logout')
const peoplesPDF = document.getElementById('peoplesPDF')

logout.addEventListener('click', function () {
  location.reload()
})

let EscalaShow = document.getElementById('EscalaShow')
let btnReload = document.getElementById('btnReload')
let btnHome = document.getElementById('btnHome')
let btnSave = document.getElementById('btnSave')

let btnSavePDF = document.getElementById('btnSavePDF')
let btnSavePDFEscala = document.getElementById('btnSavePDFEscala')

let peoples = {}

btnReload.addEventListener('click', function () {
  btnReload.style.animation = 'animationRoll linear infinite 0.5s'

  setTimeout(function () {
    btnReload.style.animation = ''
    renderPeopleConfig(peoples)
  }, 1000)

  loadPeoplesFromEscala(actualScale)
  createPeoplesPDF()
  loadPeoplesFromDatabase()
  loadEscala()
})

btnHome.addEventListener('click', function () {
  EscalaShow.classList.add('hidden')
  allEscalas.classList.remove('hidden')
})

nameEscala.addEventListener('click', function () {
  const input = document.createElement('input')
  input.type = 'text'
  input.value = this.textContent
  input.id = 'nameEscala'
  input.required = true

  this.replaceWith(input)

  nameEscala = document.getElementById('nameEscala')
  btnSave.classList.remove('hidden')
})

btnSave.addEventListener('click', function () {
  const newName = nameEscala.value || nameEscala.textContent

  const h1 = document.createElement('h1')
  h1.textContent = newName
  h1.id = 'nameEscala'

  if (!actualScale) {
    console.error('Nenhuma escala selecionada!')
    alert('Selecione uma escala antes de salvar!')
    return
  }

  const escalaRef = database.ref(`Users/${actualLogin}/Escalas/${actualScale}`)

  escalaRef
    .update({
      name: newName
    })
    .then(() => {
      console.log('Nome da escala atualizado com sucesso!')

      nameEscala.replaceWith(h1)
      nameEscala = document.getElementById('nameEscala')
      nameEscala.addEventListener('click', function () {
        const input = document.createElement('input')
        input.type = 'text'
        input.value = this.textContent
        input.id = 'nameEscala'
        input.required = true

        this.replaceWith(input)

        nameEscala = document.getElementById('nameEscala')
        btnSave.classList.remove('hidden')
      })
      btnSave.classList.add('hidden')
      loadEscalas()
    })
    .catch(error => {
      console.error('Erro ao atualizar escala:', error)
    })
})

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

// Função para calcular folgas (mantendo o nome original)
function calcSlacksForPeriod(proximoPeriodo, escala, pessoa) {
  let dataAtual = getSPTime()
  let folgas = []

  let diaInicioFolga = peoples[pessoa].FirstDay
  let mesInicioFolga = peoples[pessoa].FirstMonth
  let dupla = peoples[pessoa].Dupla // Obter o valor inicial de Dupla
  let dataInicioFolga = new Date(
    dataAtual.getFullYear(),
    mesInicioFolga - 1,
    diaInicioFolga
  )

  let ultimasFolgas = []

  // Ajuste inicial para garantir que a data de início seja correta, incluindo datas anteriores
  while (dataInicioFolga <= dataAtual) {
    ultimasFolgas.push(dataInicioFolga.toDateString())

    if (dupla) {
      let dataFolga2 = new Date(dataInicioFolga)
      dataFolga2.setDate(dataInicioFolga.getDate() + 1)
      ultimasFolgas.push(dataFolga2.toDateString())
    }

    dataInicioFolga.setDate(
      dataInicioFolga.getDate() + escala + 1 + (dupla ? 1 : 0)
    )
    dupla = !dupla // Alternar entre folga simples e dupla
  }

  // Pegar apenas as últimas 2 folgas anteriores
  ultimasFolgas = ultimasFolgas.slice(-8)

  // Loop para calcular folgas para o próximo período
  while (folgas.length < proximoPeriodo) {
    let dataFolga1 = new Date(dataInicioFolga)
    folgas.push(dataFolga1.toDateString())

    if (dupla) {
      let dataFolga2 = new Date(dataInicioFolga)
      dataFolga2.setDate(dataInicioFolga.getDate() + 1)
      folgas.push(dataFolga2.toDateString())
    }

    // Atualizar a data de início para a próxima folga
    dataInicioFolga.setDate(
      dataInicioFolga.getDate() + escala + 1 + (dupla ? 1 : 0)
    )
    dupla = !dupla
  }

  return [...ultimasFolgas, ...folgas]
}

function isSlackToday(diasFolga) {
  let dataAtual = getSPTime().toDateString()
  return diasFolga.includes(dataAtual)
}

function updateSlacks(peoples) {
  Object.keys(peoples).forEach(nome => {
    let folgas = calcSlacksForPeriod(32, 6, nome)
    peoples[nome].Folga = isSlackToday(folgas)
    peoples[nome].Folgas = folgas
  })
}

function createPeoplesPDF() {
  peoplesPDF.innerHTML = ''

  // Atualiza folgas primeiro
  updateSlacks(peoples)

  const currentDate = getSPTime()
  const currentDay = currentDate.getDate()
  const mostrarProximoMes = currentDay >= 25

  // Configurar mês para exibir
  const mesParaExibir = mostrarProximoMes
    ? currentDate.getMonth() + 1 > 11
      ? 0
      : currentDate.getMonth() + 1
    : currentDate.getMonth()
  const anoParaExibir = mostrarProximoMes
    ? currentDate.getMonth() + 1 > 11
      ? currentDate.getFullYear() + 1
      : currentDate.getFullYear()
    : currentDate.getFullYear()

  // Container do mês
  const monthContainer = document.createElement('div')
  monthContainer.className = 'container-month'

  // Cabeçalho
  const monthHeader = document.createElement('h2')
  monthHeader.textContent = `Mês - ${mesParaExibir + 1}/${anoParaExibir}`
  monthContainer.appendChild(monthHeader)

  // Processar times (mantendo estrutura original)
  let timeContainers = {}

  // Criar containers para cada time
  Object.keys(peoples).forEach(personKey => {
    const person = peoples[personKey]
    const time = (person.Time || '').toUpperCase()

    if (!timeContainers[time]) {
      const timeHeader = document.createElement('h3')
      timeHeader.textContent = time
      monthContainer.appendChild(timeHeader)

      const timeDiv = document.createElement('div')
      timeDiv.className = `Time${time.replace(/\s+/g, '')}`
      timeContainers[time] = timeDiv
      monthContainer.appendChild(timeDiv)
    }
  })

  // Processar cada pessoa
  Object.keys(peoples).forEach(personKey => {
    const person = peoples[personKey]
    const time = (person.Time || 'SEMTIME').toUpperCase()

    const personDiv = document.createElement('div')
    personDiv.className = 'person'

    // Elementos da pessoa (mantendo estrutura original)
    const matricula = document.createElement('div')
    matricula.className = 'matricula'
    matricula.textContent = person.Matricula

    const name = document.createElement('div')
    name.className = 'name'
    name.textContent = person.Name

    const timeEnter = document.createElement('div')
    timeEnter.className = 'timeEnter'
    timeEnter.textContent = person.TimeEnter

    const timeExit = document.createElement('div')
    timeExit.className = 'timeExit'
    timeExit.textContent = person.TimeExit

    const allDaysDiv = document.createElement('div')
    allDaysDiv.className = 'allDays'

    // Dias do mês
    const daysInMonth = new Date(anoParaExibir, mesParaExibir + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div')
      dayElement.className = 'day'
      dayElement.textContent = day

      // Verificar se é folga (comparando dia e mês)
      if (person.Folgas) {
        person.Folgas.forEach(folgaDateStr => {
          const folgaDate = new Date(folgaDateStr)
          if (
            folgaDate.getDate() === day &&
            folgaDate.getMonth() === mesParaExibir &&
            folgaDate.getFullYear() === anoParaExibir
          ) {
            dayElement.classList.add('slack')
          }
        })
      }

      allDaysDiv.appendChild(dayElement)
    }

    // Total de folgas no mês
    const totalFolgas = document.createElement('div')
    totalFolgas.className = 'totalFolgas'
    totalFolgas.textContent = person.Folgas
      ? person.Folgas.filter(folgaDateStr => {
          const folgaDate = new Date(folgaDateStr)
          return (
            folgaDate.getMonth() === mesParaExibir &&
            folgaDate.getFullYear() === anoParaExibir
          )
        }).length
      : 0

    // Montar estrutura
    personDiv.appendChild(matricula)
    personDiv.appendChild(name)
    personDiv.appendChild(timeEnter)
    personDiv.appendChild(timeExit)
    personDiv.appendChild(allDaysDiv)
    personDiv.appendChild(totalFolgas)

    timeContainers[time].appendChild(personDiv)
  })

  peoplesPDF.appendChild(monthContainer)
}

function updateAndSavePeoples() {
  updateSlacks(peoples)

  savePeoplesToDatabase()
}

btnSavePDF.addEventListener('click', function () {
  transformInPDF()
})

async function transformInPDF() {
  const { jsPDF } = window.jspdf
  const element = document.getElementById('peoplesPDF')

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: true,
      backgroundColor: '#ffffff'
    })

    // CONFIGURAÇÕES PERSONALIZÁVEIS (ajuste esses valores)
    const pdfConfig = {
      orientation: 'landscape',
      unit: 'in',
      format: [15, 10], // [width, height] em polegadas (customizado)
      margin: 0.5, // margem em polegadas
      contentScale: 0.99 // escala do conteúdo (90% da área útil)
    }

    const pdf = new jsPDF(pdfConfig)

    // DIMENSIONAMENTO AUTOMÁTICO (não mexa aqui - calcula proporções)
    const pageWidth = pdfConfig.format[0]
    const pageHeight = pdfConfig.format[1]

    const usableWidth = pageWidth - pdfConfig.margin * 2
    const usableHeight = pageHeight - pdfConfig.margin * 2

    const imgRatio = canvas.width / canvas.height

    // Lógica de redimensionamento proporcional
    let imgWidth = usableWidth * pdfConfig.contentScale
    let imgHeight = imgWidth / imgRatio

    if (imgHeight > usableHeight * pdfConfig.contentScale) {
      imgHeight = usableHeight * pdfConfig.contentScale
      imgWidth = imgHeight * imgRatio
    }

    // Centralização automática
    const xPos = (pageWidth - imgWidth) / 2
    const yPos = (pageHeight - imgHeight) / 2

    // DEBUG (verifique no console se os valores fazem sentido)
    console.log({
      pageSize: [pageWidth, pageHeight],
      imageSize: [imgWidth, imgHeight],
      position: [xPos, yPos],
      ratio: imgRatio
    })

    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.8),
      'JPEG',
      xPos,
      yPos,
      imgWidth,
      imgHeight
    )

    pdf.save(`EscalaFolgas${getMonthName()}.pdf`)
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
  }
}

btnSavePDFEscala.addEventListener('click', function () {
  transformInPDFPositions()
})

async function transformInPDFPositions() {
  const { jsPDF } = window.jspdf
  const element = document.getElementById('peoplesEscala')

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: true,
      backgroundColor: '#ffffff'
    })

    // CONFIGURAÇÕES PERSONALIZÁVEIS (ajuste esses valores)
    const pdfConfig = {
      orientation: 'landscape',
      unit: 'in',
      format: [15, 10], // [width, height] em polegadas (customizado)
      margin: 0.5, // margem em polegadas
      contentScale: 0.9 // escala do conteúdo (90% da área útil)
    }

    const pdf = new jsPDF(pdfConfig)

    // DIMENSIONAMENTO AUTOMÁTICO (não mexa aqui - calcula proporções)
    const pageWidth = pdfConfig.format[0]
    const pageHeight = pdfConfig.format[1]

    const usableWidth = pageWidth - pdfConfig.margin * 2
    const usableHeight = pageHeight - pdfConfig.margin * 2

    const imgRatio = canvas.width / canvas.height

    // Lógica de redimensionamento proporcional
    let imgWidth = usableWidth * pdfConfig.contentScale
    let imgHeight = imgWidth / imgRatio

    if (imgHeight > usableHeight * pdfConfig.contentScale) {
      imgHeight = usableHeight * pdfConfig.contentScale
      imgWidth = imgHeight * imgRatio
    }

    // Centralização automática
    const xPos = (pageWidth - imgWidth) / 2
    const yPos = (pageHeight - imgHeight) / 2

    // DEBUG (verifique no console se os valores fazem sentido)
    console.log({
      pageSize: [pageWidth, pageHeight],
      imageSize: [imgWidth, imgHeight],
      position: [xPos, yPos],
      ratio: imgRatio
    })

    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.8),
      'JPEG',
      xPos,
      yPos,
      imgWidth,
      imgHeight
    )

    pdf.save(`EscalaPosições${getMonthName()}.pdf`)
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
  }
}

function getMonthName() {
  const date = getSPTime()
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ]
  return months[date.getMonth()]
}

/////////////////////////////////////////////////////////////////
////////////////////ESCALAS ADD/REMOVE PEOPLE////////////////////

let btnAddPeople = document.getElementById('btnAddPeople')
let btnRemovePeople = document.getElementById('btnRemovePeople')

let addPeopleScreen = document.getElementById('addPeopleScreen')
let closeAddPeopleScreen = document.getElementById('closeAddPeopleScreen')
let savePeopleInPeoples = document.getElementById('savePeopleInPeoples')

btnAddPeople.addEventListener('click', function () {
  addPeopleScreen.classList.remove('hidden')
})

btnRemovePeople.addEventListener('click', function () {
  removePeople()
})

closeAddPeopleScreen.addEventListener('click', function () {
  addPeopleScreen.classList.add('hidden')
})

savePeopleInPeoples.addEventListener('click', e => {
  e.preventDefault()
  addPeople()
  savePeoplesToDatabase()
})

function addPeople() {
  const matricula = document.getElementById('registry').value
  const nome = document.getElementById('addPeopleName').value
  const entrada = document.getElementById('addTimeEnterPeople').value
  const saida = document.getElementById('addTimeExitPeople').value
  const turno = document.getElementById('addPeopleTime').value
  const primeiroDia = parseInt(
    document.getElementById('addPeopleFirstDay').value
  )
  const primeiroMes = parseInt(
    document.getElementById('addPeopleFirstMonth').value
  )
  const escala = document.getElementById('addPeopleTypeScale').value
  const Role = document.getElementById('addPeopleRole').value

  peoples[matricula] = {
    Matricula: matricula,
    Name: nome,
    TimeEnter: entrada,
    TimeExit: saida,
    Time: turno,
    FirstDay: primeiroDia,
    FirstMonth: primeiroMes,
    Folga: false,
    Double: false,
    Holiday: false,
    Docket: false,
    Folgas: [],
    Scale: escala,
    Additionals: {
      Role: Role
    }
  }

  addPeopleScreen.classList.add('hidden')
  return peoples[matricula]
}

function removePeople() {
  const matricula = prompt('Digite a matrícula:')
  if (!matricula) return

  if (peoples[matricula]) {
    firebase
      .database()
      .ref(`Users/${actualLogin}/Escalas/${actualScale}/peoples/${matricula}`)
      .remove()
      .then(() => {
        delete peoples[matricula]
        console.log('Removido com sucesso!')
        setTimeout(() => {
          loadPeoplesFromEscala(actualScale)
          createPeoplesPDF()
          loadPeoplesFromDatabase()
        }, 1000)
      })
  } else {
    console.log('Matrícula não encontrada!')
  }
}

function savePeoplesToDatabase() {
  if (!actualScale) {
    console.error('Nenhuma escala selecionada!')
    return
  }

  if (!peoples || Object.keys(peoples).length === 0) {
    console.error('Nenhum dado para salvar!')
    return
  }

  const escalaPeoplesRef = database.ref(
    `Users/${actualLogin}/Escalas/${actualScale}/peoples`
  )

  escalaPeoplesRef.set(peoples, function (error) {
    if (error) {
      console.error('Erro ao salvar pessoas:', error)
    } else {
      console.log('Dados salvos com sucesso na escala:', actualScale)
      createPeoplesPDF() // Atualiza a exibição após salvar
    }
  })
}

/////////////////////////////////////////////////////////////////
////////////////////////////BUTTONS//////////////////////////////

let btnFolgas = document.getElementById('btnFolgas')
let btnEscalaShow = document.getElementById('btnEscalaShow')
let btnConfigsEscala = document.getElementById('btnConfigsEscala')
let btnConfigsPeoples = document.getElementById('btnConfigsPeoples')

let peoplesEscala = document.getElementById('peoplesEscala')
let peoplesConfigEscala = document.getElementById('peoplesConfigEscala')
let btnDeliverPeoples = document.getElementById('btnDeliverPeoples')
let peoplesConfig = document.getElementById('peoplesConfig')

btnFolgas.addEventListener('click', function () {
  peoplesPDF.classList.remove('hidden')
  btnSavePDF.classList.remove('hidden')

  peoplesEscala.classList.add('hidden')
  btnSavePDFEscala.classList.add('hidden')
  btnDeliverPeoples.classList.add('hidden')
  peoplesConfig.classList.add('hidden')

  peoplesConfigEscala.classList.add('hidden')
})

btnEscalaShow.addEventListener('click', function () {
  peoplesPDF.classList.add('hidden')
  btnSavePDF.classList.add('hidden')
  peoplesConfig.classList.add('hidden')

  btnDeliverPeoples.classList.remove('hidden')
  peoplesEscala.classList.remove('hidden')
  btnSavePDFEscala.classList.remove('hidden')

  peoplesConfigEscala.classList.add('hidden')
})

btnConfigsEscala.addEventListener('click', function () {
  peoplesPDF.classList.add('hidden')
  btnSavePDF.classList.add('hidden')
  btnDeliverPeoples.classList.add('hidden')
  peoplesConfig.classList.add('hidden')

  peoplesEscala.classList.add('hidden')
  btnSavePDFEscala.classList.add('hidden')

  peoplesConfigEscala.classList.remove('hidden')
})

btnConfigsPeoples.addEventListener('click', function () {
  peoplesPDF.classList.add('hidden')
  btnSavePDF.classList.add('hidden')
  btnDeliverPeoples.classList.add('hidden')

  peoplesConfig.classList.remove('hidden')

  peoplesEscala.classList.add('hidden')
  btnSavePDFEscala.classList.add('hidden')

  peoplesConfigEscala.classList.add('hidden')
})

/////////////////////////////////////////////////////////////////
/////////////////////////ESCALACONFIG////////////////////////////

let savePosition

function getFirstTwoNames(fullName) {
  const names = fullName.trim().split(/\s+/)

  if (names.length >= 3 && /^(da|de|do|das|dos)$/i.test(names[1])) {
    return `${names[0]} ${names[2]}`
  }

  return names.slice(0, 2).join(' ')
}

function createPosition() {
  const positionsContainer = document.getElementById('positionsContainer')

  const positionDiv = document.createElement('div')
  positionDiv.className = 'positionsEscala'

  // Obter horários únicos em maiúsculas
  const horariosUnicos = [
    ...new Set(
      Object.values(peoples)
        .filter(p => p.Time)
        .map(p => p.Time.toUpperCase())
    )
  ]

  // Obter Roles únicos (se existirem)
  const rolesUnicos = [
    ...new Set(
      Object.values(peoples)
        .filter(p => p.Additionals && p.Additionals.Role)
        .map(p => p.Additionals.Role)
        .filter(role => role) // Remove valores vazios
    )
  ]

  // HTML da posição
  positionDiv.innerHTML = `
    <div class="config-group">
      <label>Nome da Posição</label>
      <input autocomplete="off" class="inptNamePosition" type="text" class="pos-nome" required>
    </div>
    
    <div class="config-group">
      <label>Quantidade Mínima</label>
      <input class="inptQuantMinPosition" type="number" class="pos-min" min="0" value="0">
    </div>
    
    <div class="config-group">
      <label>Quantidade Fixa</label>
      <input class="inptQuantFixPosition" type="number" class="pos-fixa" min="0" value="0">
    </div>
    
    <div class="config-group">
      <label>Pessoas Fixas</label>
      <div class="options-container pessoas-container">
        ${Object.values(peoples)
          .map(
            pessoa => `
          <label class="option-item">
            <input class="inptPeopleFixPositions" type="checkbox" value="${
              pessoa.Matricula
            }">
            <span>${getFirstTwoNames(pessoa.Name)}</span>
          </label>
        `
          )
          .join('')}
      </div>
    </div>
    
    <div class="config-group">
      <label>Horários</label>
      <div class="options-container horarios-container">
        ${horariosUnicos
          .map(
            horario => `
          <label class="option-item">
            <input class="inptTimesPositions" type="checkbox" value="${horario}">
            <span>${horario}</span>
          </label>
        `
          )
          .join('')}
      </div>
    </div>
    
    ${
      rolesUnicos.length > 0
        ? `
    <div class="config-group">
      <label>Cargos</label>
      <div class="options-container roles-container">
        ${rolesUnicos
          .map(
            role => `
          <label class="option-item">
            <input class="inptRolesPositions" type="checkbox" value="${role}">
            <span>${role}</span>
          </label>
        `
          )
          .join('')}
      </div>
    </div>
    `
        : ''
    }
    
    <button type="button" class="savePosition">Salvar Posição</button>
    <button type="button" class="removePosition">Remover Posição</button>
  `

  positionDiv
    .querySelector('.removePosition')
    .addEventListener('click', function () {
      removePosition_(this.parentElement)
    })

  positionDiv
    .querySelector('.savePosition')
    .addEventListener('click', function () {
      savePosition_(this)
    })

  positionsContainer.appendChild(positionDiv)
}

async function removePosition_(positionDiv) {
  if (!confirm('Tem certeza que deseja remover esta posição?')) return

  const positionName = positionDiv.querySelector('.inptNamePosition').value
  if (!positionName) {
    alert('Posição sem nome não pode ser removida!')
    return
  }

  try {
    const escalaRef = database.ref(
      `Users/${actualLogin}/Escalas/${actualScale}`
    )

    // Adicione await aqui
    const snapshot = await escalaRef.once('value')
    const data = snapshot.val()

    // 1. Prepara os updates para o Firebase
    const updates = {}

    // Remove do positionsData
    if (data.positionsData && data.positionsData[positionName]) {
      updates[`positionsData/${positionName}`] = null
    }

    // Remove do escalaPositions
    if (data.escalaPositions && data.escalaPositions[positionName]) {
      updates[`escalaPositions/${positionName}`] = null
    }

    // 2. Executa a remoção no Firebase em uma única operação
    if (Object.keys(updates).length > 0) {
      await escalaRef.update(updates) // Adicione await aqui também
    }

    // 3. Remove da tela:
    //    - A div da posição na lista de configurações
    positionDiv.remove()

    //    - TODOS os elementos no peoplesEscala com data-remove correspondente
    document
      .querySelectorAll(
        `.escalaPosition[data-remove="${CSS.escape(positionName)}"]`
      )
      .forEach(element => {
        element.remove()
      })

    alert('Posição removida com sucesso!')
  } catch (error) {
    console.error('Erro ao remover posição:', error)
    alert('Erro ao remover posição.')
  }
}

async function savePosition_(position) {
  createInPeoplesEscala(position)
}

function getPessoasSelecionadas(posElement) {
  return Array.from(
    posElement.querySelectorAll('.pessoas-container input:checked')
  ).map(el => el.value)
}

function getHorariosSelecionados(posElement) {
  return Array.from(
    posElement.querySelectorAll('.horarios-container input:checked')
  ).map(el => el.value)
}

///////////////////////////////////////////////////////////////////
function createInPeoplesEscala(button) {
  let father = button.parentElement

  let inptName = father.querySelector('.inptNamePosition').value
  let inptQuantMin = father.querySelector('.inptQuantMinPosition').value
  let inptQuantFix = father.querySelector('.inptQuantFixPosition').value
  let inptPeopleFix = father.querySelectorAll('.inptPeopleFixPositions')
  let inptRoles = father.querySelectorAll('.inptRolesPositions')
  let inptTimes = father.querySelectorAll('.inptTimesPositions')

  // Verifica se é a primeira posição sendo criada
  const firstPosition = peoplesEscala.querySelector('.escalaPosition') === null

  if (firstPosition) {
    // Cria os 7 dias da semana (domingo a sábado)
    createWeekDays()
  }

  // Adiciona ou atualiza a posição para cada dia existente
  const daysContainers = peoplesEscala.querySelectorAll('.day-container')

  daysContainers.forEach(dayContainer => {
    // Verifica se a posição já existe neste dia
    const existingPosition = Array.from(
      dayContainer.querySelectorAll('.escalaPosition')
    ).find(pos => pos.querySelector('.textNameValue')?.textContent === inptName)

    if (existingPosition) {
      // ATUALIZA a posição existente
      updateExistingPosition(
        existingPosition,
        inptName,
        inptQuantMin,
        inptQuantFix,
        inptPeopleFix,
        inptRoles,
        inptTimes
      )
    } else {
      // CRIA nova posição
      dayContainer.innerHTML += `
        <div class="escalaPosition" data-remove="${inptName}">
          <h2 class="textNameValue">${inptName}</h2>
          <div class="spacePeopleMin"></div>
          <div class="spacePeopleFix"></div>
          <div class="spacePeoplesFixed"></div>
          <div class="spacePeoplesTimes"></div>
        </div>
      `

      const newPosition = dayContainer.lastElementChild
      setupNewPosition(
        newPosition,
        inptName,
        inptQuantMin,
        inptQuantFix,
        inptPeopleFix,
        inptRoles,
        inptTimes
      )
    }
  })
}

function updateExistingPosition(
  position,
  name,
  quantMin,
  quantFix,
  peopleFix,
  roles,
  times
) {
  // Atualiza os elementos básicos
  position.querySelector('.textNameValue').textContent = name

  // Limpa os conteúdos
  const spacePeopleMin = position.querySelector('.spacePeopleMin')
  const spacePeopleFix = position.querySelector('.spacePeopleFix')
  const spacePeoplesFixed = position.querySelector('.spacePeoplesFixed')
  const spacePeoplesTimes = position.querySelector('.spacePeoplesTimes')

  spacePeopleMin.innerHTML = ''
  spacePeopleFix.innerHTML = ''
  spacePeoplesFixed.innerHTML = ''
  spacePeoplesTimes.innerHTML = ''

  // Remove classes hidden e atributos
  spacePeopleMin.classList.remove('hidden')
  spacePeopleFix.classList.remove('hidden')
  position.removeAttribute('data-type')
  position
    .querySelectorAll('[data-role]')
    .forEach(el => el.removeAttribute('data-role'))

  // Reconstrói a posição com os novos valores
  setupNewPosition(position, name, quantMin, quantFix, peopleFix, roles, times)
}

function setupNewPosition(
  position,
  name,
  quantMin,
  quantFix,
  peopleFix,
  roles,
  times
) {
  let min = 0
  let fix = 0
  let fixed = 0

  const spacePeopleMin = position.querySelector('.spacePeopleMin')
  const spacePeopleFix = position.querySelector('.spacePeopleFix')
  const spacePeoplesFixed = position.querySelector('.spacePeoplesFixed')
  const spacePeoplesTimes = position.querySelector('.spacePeoplesTimes')

  // Configura quantidade mínima
  if (quantMin != 0) {
    for (let i = 0; i < quantMin; i++) {
      spacePeopleMin.innerHTML += `<div class="spPplMin"></div>`
      min++
    }
  } else {
    spacePeopleMin.classList.add('hidden')
  }

  // Configura quantidade fixa
  if (quantFix != 0) {
    for (let i = 0; i < quantFix; i++) {
      spacePeopleFix.innerHTML += `<div class="spPplFix"></div>`
      fix++
    }
  } else {
    spacePeopleFix.classList.add('hidden')
  }

  // Configura pessoas fixas
  peopleFix.forEach(inptFix => {
    if (inptFix.checked) {
      spacePeoplesFixed.innerHTML += `<h2 data-people="${
        peoples[inptFix.value].Matricula
      }"></h2>`
      fixed++
    }
  })

  // Configura horários
  times.forEach(inptTime => {
    if (inptTime.checked) {
      spacePeoplesTimes.innerHTML += `<h2>${inptTime.value}</h2>`
    }
  })

  // Configura roles
  roles.forEach(inptRole => {
    if (inptRole.checked) {
      spacePeopleMin.setAttribute('data-role', inptRole.value)
      spacePeopleFix.setAttribute('data-role', inptRole.value)
    }
  })

  // Define o tipo da posição
  if (min > 0) {
    position.setAttribute('data-type', 'min')
  } else if (fix > 0) {
    position.setAttribute('data-type', 'fix')
  } else if (fixed > 0) {
    position.setAttribute('data-type', 'fixed')
  }
}

function createWeekDays() {
  const now = getSPTime()
  const currentDay = now.getDay() // 0 (domingo) a 6 (sábado)
  const currentDate = now.getDate()

  // Encontra o domingo mais recente (início da semana)
  const startDate = new Date(now)
  startDate.setDate(currentDate - currentDay)

  // Limpa o container principal
  peoplesEscala.innerHTML = ''

  // Cria os 7 dias da semana
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + i)

    const dayName = getDayName(dayDate.getDay())
    const formattedDate = formatDate(dayDate)

    peoplesEscala.innerHTML += `
      <div class="day-container">
        <h1 class="day-title">${dayName} - ${formattedDate}</h1>
      </div>
    `
  }
  document
    .getElementById('peoplesEscala')
    .addEventListener('click', function (e) {
      const dayContainer = e.target.closest('.day-container')
      if (dayContainer) {
        fullScreen(dayContainer)
      }
    })
}

function getDayName(dayIndex) {
  const days = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado'
  ]
  return days[dayIndex]
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

function fullScreen(clickedDayContainer) {
  const isFullScreen = clickedDayContainer.classList.contains('full-screen')
  const allContainers = document.querySelectorAll('.day-container')

  // Alterna entre os estados
  allContainers.forEach(container => {
    if (container === clickedDayContainer) {
      container.classList.toggle('full-screen', !isFullScreen)
    } else {
      container.classList.toggle('hidden', !isFullScreen)
    }
  })

  // Adiciona/remove classe do container principal
  peoplesEscala.classList.toggle('full-screen-mode', !isFullScreen)

  if (!isFullScreen) {
    clickedDayContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Adiciona os event listeners a todos os day-containers
document.querySelectorAll('.day-container').forEach(container => {
  container.addEventListener('click', function () {
    fullScreen(this)
  })
})

////////////////////////////////////////////////////////////////

function getFolgaStringFromDayMonth(day, month) {
  try {
    const spDate = getSPTime()
    const date = new Date(spDate.getFullYear(), month - 1, day)

    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.error('Data inválida:', { day, month })
      return ''
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]

    return `${days[date.getDay()]} ${months[date.getMonth()]} ${
      date.getDate() < 10 ? '0' : ''
    }${date.getDate()} ${date.getFullYear()}`
  } catch (error) {
    console.error('Erro ao formatar data de folga:', error)
    return ''
  }
}

function deliverPeoples() {
  // Zera completamente a escala antes de redistribuir
  document.querySelectorAll('.day-container').forEach(dayContainer => {
    dayContainer.querySelectorAll('.escalaPosition').forEach(position => {
      position.querySelectorAll('[data-assigned="true"]').forEach(assigned => {
        assigned.removeAttribute('data-assigned')
        assigned.removeAttribute('data-people')
        assigned.textContent = ''
      })
    })
  })

  // Objetos para controle
  const globalUsage = {}
  Object.keys(peoples).forEach(matricula => {
    globalUsage[matricula] = 0
  })

  // Para cada dia
  document
    .querySelectorAll('.day-container')
    .forEach((dayContainer, dayIndex) => {
      const dayTitle = dayContainer.querySelector('.day-title').textContent
      const [_, dateStr] = dayTitle.split(' - ')
      const [day, month] = dateStr.split('/').map(Number)
      const dailyUsed = new Set()

      // Ordena as posições de forma diferente cada dia
      const positions = Array.from(
        dayContainer.querySelectorAll('.escalaPosition')
      )
      const rotatedPositions = rotatePositions(positions, dayIndex)

      // Processa posições fixas primeiro
      rotatedPositions.forEach((position, posIndex) => {
        const fixedElements = position.querySelectorAll(
          '.spacePeoplesFixed h2[data-people]'
        )
        fixedElements.forEach(el => {
          const matricula = el.dataset.people
          if (isPersonAvailable(peoples[matricula], day, month)) {
            el.textContent = peoples[matricula].Name
            dailyUsed.add(matricula)
            globalUsage[matricula]++
          } else {
            const requiredRole = position.querySelector(
              '.spacePeopleMin, .spacePeopleFix'
            )?.dataset.role
            const replacement = findBestPersonForPosition(
              getRequiredTimes(position),
              day,
              month,
              Array.from(dailyUsed),
              globalUsage,
              position.dataset.type,
              posIndex,
              0,
              requiredRole
            )
            if (replacement) {
              el.textContent = replacement.Name
              el.dataset.people = replacement.Matricula
              dailyUsed.add(replacement.Matricula)
              globalUsage[replacement.Matricula]++
            }
          }
        })
      })

      // Processa posições min e fix
      rotatedPositions.forEach((position, posIndex) => {
        const requiredRole = position.querySelector(
          '.spacePeopleMin, .spacePeopleFix'
        )?.dataset.role

        processPositionWithRotation(
          position.querySelector('.spacePeopleMin'),
          'spPplMin',
          day,
          month,
          dailyUsed,
          globalUsage,
          getRequiredTimes(position),
          position.dataset.type,
          posIndex,
          requiredRole
        )

        processPositionWithRotation(
          position.querySelector('.spacePeopleFix'),
          'spPplFix',
          day,
          month,
          dailyUsed,
          globalUsage,
          getRequiredTimes(position),
          position.dataset.type,
          posIndex,
          requiredRole
        )
      })
    })

  saveEscala()
}

// Função modificada para incluir requiredRole
function processPositionWithRotation(
  container,
  slotClass,
  day,
  month,
  dailyUsed,
  globalUsage,
  requiredTimes,
  positionType,
  posIndex,
  requiredRole
) {
  if (!container || container.classList.contains('hidden')) return

  const slots = container.querySelectorAll(`.${slotClass}`)
  slots.forEach((slot, slotIndex) => {
    if (!slot.dataset.assigned) {
      const assignedPerson = findBestPersonForPosition(
        requiredTimes,
        day,
        month,
        Array.from(dailyUsed),
        globalUsage,
        positionType,
        posIndex,
        slotIndex,
        requiredRole
      )

      if (assignedPerson) {
        slot.textContent = assignedPerson.Name
        slot.dataset.people = assignedPerson.Matricula
        slot.dataset.assigned = 'true'
        dailyUsed.add(assignedPerson.Matricula)
        globalUsage[assignedPerson.Matricula]++
      }
    }
  })
}

function findBestPersonForPosition(
  requiredTimes,
  day,
  month,
  excludedMatriculas,
  globalUsage,
  positionType,
  posIndex,
  slotIndex = 0,
  requiredRole = null
) {
  let candidates = Object.values(peoples).filter(person => {
    // Verifica disponibilidade básica
    const available =
      isPersonAvailable(person, day, month) &&
      !excludedMatriculas.includes(person.Matricula)

    if (!available) return false

    // Verifica os tempos (case insensitive)
    if (requiredTimes.length > 0) {
      const personTime = person.Time ? person.Time.toUpperCase() : ''
      if (!requiredTimes.some(t => t.toUpperCase() === personTime)) return false
    }

    // Verifica role se necessário
    if (requiredRole) {
      return person.Additionals && person.Additionals.Role === requiredRole
    }

    return true
  })

  if (candidates.length === 0) return null

  // Prioriza pessoas menos utilizadas globalmente
  candidates.forEach(person => {
    let score = 0
    score +=
      (1 -
        globalUsage[person.Matricula] /
          Math.max(...Object.values(globalUsage))) *
      50
    score += (posIndex % (person.Matricula.charCodeAt(0) % 7)) * 5
    score += slotIndex * 2
    if (positionType === 'fix') score += 10
    person.score = score
  })

  candidates.sort((a, b) => b.score - a.score)

  return candidates[0]
}

// Rotaciona a ordem das posições para cada dia
function rotatePositions(positions, dayIndex) {
  const rotationOffset = dayIndex % positions.length
  return [
    ...positions.slice(rotationOffset),
    ...positions.slice(0, rotationOffset)
  ]
}

// Função para obter tempos requeridos de uma posição
function getRequiredTimes(position) {
  const times = []
  const timeElements = position.querySelectorAll('.spacePeoplesTimes h2')
  timeElements.forEach(el => {
    // Normaliza para uppercase para garantir consistência
    times.push(el.textContent.trim().toUpperCase())
  })
  return times
}

function isPersonAvailable(person, day, month) {
  if (person.Holiday || person.Docket) return false

  // Verifica se a pessoa tem folga nesse dia
  if (person.Folgas && person.Folgas.length > 0) {
    const folgaString = getFolgaStringFromDayMonth(day, month)
    if (person.Folgas.includes(folgaString)) {
      return false
    }
  }

  return true
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

async function saveEscala() {
  try {
    if (!actualLogin || !actualScale) {
      throw new Error('Usuário ou escala não identificados')
    }

    const snapshot = await database
      .ref(`Users/${actualLogin}/Escalas/${actualScale}`)
      .once('value')
    const currentData = snapshot.val() || {}

    // Salva positionsData como objeto (chave = nome da posição)
    const positionsData = {}
    const positionElements = document.querySelectorAll(
      '#positionsContainer .positionsEscala'
    )

    positionElements.forEach(position => {
      const positionName = position
        .querySelector('.inptNamePosition')
        ?.value.trim()
      if (!positionName) return

      positionsData[positionName] = {
        html: position.outerHTML,
        values: {
          name: positionName,
          quantMin:
            position.querySelector('.inptQuantMinPosition')?.value || '0',
          quantFix:
            position.querySelector('.inptQuantFixPosition')?.value || '0',
          peopleFix: Array.from(
            position.querySelectorAll('.inptPeopleFixPositions:checked')
          ).map(el => el.value),
          times: Array.from(
            position.querySelectorAll('.inptTimesPositions:checked')
          ).map(el => el.value),
          roles: Array.from(
            position.querySelectorAll('.inptRolesPositions:checked')
          ).map(el => el.value)
        }
      }
    })

    // Salva apenas as posições individuais do peoplesEscala (sem os day-containers)
    const escalaPositions = {}
    document
      .querySelectorAll('#peoplesEscala .escalaPosition')
      .forEach(position => {
        const positionName = position
          .querySelector('.textNameValue')
          ?.textContent.trim()
        if (positionName) {
          escalaPositions[positionName] = position.outerHTML
        }
      })

    // Prepara os dados para atualização
    const updateData = {
      positionsData,
      escalaPositions, // Agora salvamos apenas as posições individuais
      updatedAt: Date.now(),
      updatedBy: actualLogin
    }

    // Mantém o nome da escala
    if (currentData.name) {
      updateData.name = currentData.name
    } else if (document.getElementById('escalaName')?.value) {
      updateData.name = document.getElementById('escalaName').value
    }

    await database
      .ref(`Users/${actualLogin}/Escalas/${actualScale}`)
      .update(updateData)
    console.log('Escala salva com sucesso!')
    return true
  } catch (error) {
    console.error('Erro ao salvar escala:', error)
    return false
  }
}

async function loadEscala() {
  try {
    if (!actualLogin || !actualScale) {
      console.log('Usuário ou escala não identificados - criando nova escala')
      return false
    }

    const snapshot = await database
      .ref(`Users/${actualLogin}/Escalas/${actualScale}`)
      .once('value')
    const escalaData = snapshot.val()

    if (!escalaData) {
      console.log('Nenhuma escala salva encontrada - iniciando nova escala')
      return false
    }

    // Carrega peoplesEscala - cria a estrutura dos dias primeiro
    const peoplesEscalaContainer = document.getElementById('peoplesEscala')
    peoplesEscalaContainer.innerHTML = ''

    // Cria os dias da semana
    createWeekDays()

    // Adiciona as posições salvas em cada dia correspondente
    if (escalaData.escalaPositions) {
      Object.values(escalaData.escalaPositions).forEach(positionHTML => {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = positionHTML
        const positionElement = tempDiv.firstChild

        // Adiciona a posição em todos os dias
        document
          .querySelectorAll('#peoplesEscala .day-container')
          .forEach(day => {
            day.appendChild(positionElement.cloneNode(true))
          })
      })
    }

    // Carrega positionsData (configurações das posições)
    const positionsContainer = document.getElementById('positionsContainer')
    positionsContainer.innerHTML = ''

    if (escalaData.positionsData) {
      Object.values(escalaData.positionsData).forEach(positionObj => {
        if (!positionObj?.html) return

        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = positionObj.html
        const positionElement = tempDiv.firstChild

        // Preenche os valores salvos
        if (positionObj.values) {
          const { name, quantMin, quantFix, peopleFix, times, roles } =
            positionObj.values

          // Preenche inputs básicos
          positionElement.querySelector('.inptNamePosition').value = name
          positionElement.querySelector('.inptQuantMinPosition').value =
            quantMin
          positionElement.querySelector('.inptQuantFixPosition').value =
            quantFix

          // Marca checkboxes
          const checkboxes = {
            peopleFix: '.inptPeopleFixPositions',
            times: '.inptTimesPositions',
            roles: '.inptRolesPositions'
          }

          Object.entries(checkboxes).forEach(([key, selector]) => {
            const values = positionObj.values[key]
            if (values?.length) {
              positionElement.querySelectorAll(selector).forEach(checkbox => {
                checkbox.checked = values.includes(checkbox.value)
              })
            }
          })
        }

        positionsContainer.appendChild(positionElement)
      })

      reattachPositionEventListeners()
    }

    return true
  } catch (error) {
    console.error('Erro ao carregar escala:', error)
    return false
  }
}

function reattachPositionEventListeners() {
  // Remove listeners antigos
  document.querySelectorAll('.removePosition').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true))
  })

  document.querySelectorAll('.savePosition').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true))
  })

  // Adiciona novos listeners
  document.querySelectorAll('.removePosition').forEach(button => {
    button.addEventListener('click', async function () {
      // Adicione async aqui
      await removePosition_(this.parentElement) // Adicione await aqui
    })
  })

  document.querySelectorAll('.savePosition').forEach(button => {
    button.addEventListener('click', async function () {
      await savePosition_(this)
    })
  })
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

function renderPeopleConfig(peoples) {
  const peopleList = document.getElementById('peopleList')
  peopleList.innerHTML = ''

  Object.entries(peoples).forEach(([matricula, person]) => {
    const personDiv = document.createElement('div')
    personDiv.className = 'person-card'
    personDiv.dataset.matricula = matricula

    // Campos editáveis
    personDiv.innerHTML = `
  <div class="person-header">
    <h3>${person.Name || 'Nome não informado'}</h3>
    <span class="matricula">Matrícula: ${person.Matricula || ''}</span>
  </div>
  
  <div class="form-row">
    <div class="form-group half-width">
      <label>Cargo</label>
      <input type="text" class="person-field" data-field="Additionals.Role" value="${
        person.Additionals?.Role || ''
      }" />
    </div>
    <div class="form-group half-width">
      <label>Escala</label>
      <input type="text" class="person-field" data-field="Scale" value="${
        person.Scale || ''
      }" />
    </div>
  </div>
  
  <div class="form-row">
    <div class="form-group third-width">
      <label>Time</label>
      <input type="text" class="person-field" data-field="Time" value="${
        person.Time || ''
      }" />
    </div>
    <div class="form-group third-width">
      <label>Entrada</label>
      <input type="time" class="person-field" data-field="TimeEnter" value="${
        person.TimeEnter || ''
      }" />
    </div>
    <div class="form-group third-width">
      <label>Saída</label>
      <input type="time" class="person-field" data-field="TimeExit" value="${
        person.TimeExit || ''
      }" />
    </div>
  </div>
  
  <div class="form-row">
    <div class="form-group half-width">
      <label>Dia Inicial</label>
      <input type="number" min="1" max="31" class="person-field" data-field="FirstDay" value="${
        person.FirstDay || ''
      }" />
    </div>
    <div class="form-group half-width">
      <label>Mês Inicial</label>
      <input type="number" min="1" max="12" class="person-field" data-field="FirstMonth" value="${
        person.FirstMonth || ''
      }" />
    </div>
  </div>
  
  <div class="form-row checkbox-row">
    <div class="form-group checkbox-group">
      <label>
        <input type="checkbox" class="person-field" data-field="Docket" ${
          person.Docket ? 'checked' : ''
        } />
        Atestado
      </label>
    </div>
    <div class="form-group checkbox-group">
      <label>
        <input type="checkbox" class="person-field" data-field="Holiday" ${
          person.Holiday ? 'checked' : ''
        } />
        Férias
      </label>
    </div>
  </div>
  
  <button class="save-btn" data-matricula="${matricula}">Salvar Alterações</button>
`

    peopleList.appendChild(personDiv)
  })

  // Adiciona event listeners para os botões de salvar
  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const matricula = this.dataset.matricula
      const personCard = this.closest('.person-card')
      const fields = personCard.querySelectorAll('.person-field')

      const updates = {}
      fields.forEach(field => {
        const fieldName = field.dataset.field
        let value

        if (field.type === 'checkbox') {
          value = field.checked
        } else if (field.type === 'number') {
          value = parseInt(field.value) || 0
        } else {
          value = field.value
        }

        // Para campos aninhados como Additionals.Role
        if (fieldName.includes('.')) {
          const [parent, child] = fieldName.split('.')
          updates[parent] = {
            ...peoples[matricula][parent],
            [child]: value
          }
        } else {
          updates[fieldName] = value
        }
      })

      // Atualiza no banco de dados
      if (actualScale && actualLogin) {
        const personRef = database.ref(
          `Users/${actualLogin}/Escalas/${actualScale}/peoples/${matricula}`
        )
        personRef
          .update(updates)
          .then(() => {
            console.log(`Dados de ${matricula} atualizados com sucesso!`)
            alert('Alterações salvas com sucesso!')
          })
          .catch(error => {
            console.error('Erro ao atualizar pessoa:', error)
            alert('Erro ao salvar alterações!')
          })
      } else {
        alert('Nenhuma escala selecionada ou usuário não logado!')
      }
    })
  })
}

// Quando precisar exibir o peoplesConfig:
// document.getElementById('peoplesConfig').classList.remove('hidden');
// renderPeopleConfig(peoplesData);

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
async function restorePeoples() {
  try {
    const peoplesData = {
      15343: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 6,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '15343',
        Name: 'Marcos Vinicius de Souza',
        Scale: '6/1 - 6/2',
        Time: 'h1',
        TimeEnter: '16:15',
        TimeExit: '22:15'
      },
      15702: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 1,
        FirstMonth: 1,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '15702',
        Name: 'Florisvaldo Freitas Silva',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      16240: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 8,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '16240',
        Name: 'Laiza da Conceição da Silva',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      18171: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 7,
        FirstMonth: 1,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '18171',
        Name: 'Vitor Oliveira Barbosa',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      20860: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 12,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '20860',
        Name: 'Gabriel de Souza Lima',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      25137: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 1,
        FirstMonth: 1,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '25137',
        Name: 'João Vitor Dias',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      25533: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 4,
        FirstMonth: 1,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '25533',
        Name: 'Matheus Pereira Ramos',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      26175: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 10,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '26175',
        Name: 'Bruno Correia da Silva',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      27978: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 1,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '27978',
        Name: 'Victor Augusto Ramos Clemente',
        Scale: '6/1 - 6/2',
        Time: 'h1',
        TimeEnter: '16:15',
        TimeExit: '22:15'
      },
      96600: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 13,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '96600',
        Name: 'Antonio Jose Alves Viana',
        Scale: '6/1 - 6/2',
        Time: 'H2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      98015: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 12,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '98015',
        Name: 'Gabriel Martins Filho',
        Scale: '6/1 - 6/2',
        Time: 'H1',
        TimeEnter: '16:15',
        TimeExit: '22:15'
      },
      98017: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 3,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '98017',
        Name: 'Bruno Machado Sidomo',
        Scale: '6/1 - 6/2',
        Time: 'H1',
        TimeEnter: '16:15',
        TimeExit: '22:15'
      },
      98026: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 2,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '98026',
        Name: 'João Severino de Lira',
        Scale: '6/1 - 6/2',
        Time: 'H2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      }
    }

    await database
      .ref(`Users/${actualLogin}/Escalas/${actualScale}/peoples`)
      .set(peoplesData)
    console.log('Peoples restaurados com sucesso!')
    return true
  } catch (error) {
    console.error('Erro ao restaurar peoples:', error)
    return false
  }
}
