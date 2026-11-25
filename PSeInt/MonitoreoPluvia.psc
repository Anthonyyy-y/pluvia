// Perfil: Flexible con indices de arreglos y cadenas en base 0.
// Un punto de monitoreo. Valores didacticos, no calibracion de hardware.
Funcion valido <- EsNumero(texto)
    Definir valido Como Logico
    Definir i, digitos, separadores Como Entero
    Definir simbolo Como Cadena
    valido <- Longitud(texto) > 0
    digitos <- 0
    separadores <- 0
    Para i <- 0 Hasta Longitud(texto) - 1 Hacer
        simbolo <- Subcadena(texto, i, i)
        Si simbolo >= "0" Y simbolo <= "9" Entonces
            digitos <- digitos + 1
        SiNo
            Si simbolo = "." O simbolo = "," Entonces
                separadores <- separadores + 1
            SiNo
                Si NO (i = 0 Y (simbolo = "+" O simbolo = "-")) Entonces
                    valido <- Falso
                FinSi
            FinSi
        FinSi
    FinPara
    valido <- valido Y digitos > 0 Y separadores <= 1
FinFuncion

Funcion numero <- LeerNumero(mensaje)
    Definir numero Como Real
    Definir texto, normalizado, simbolo Como Cadena
    Definir valido Como Logico
    Definir i Como Entero
    Repetir
        Escribir mensaje
        Leer texto
        valido <- EsNumero(texto)
        Si NO valido Entonces
            Escribir "Entrada invalida: escriba un numero finito (ejemplo: 6.5)."
        FinSi
    Hasta Que valido
    normalizado <- ""
    Para i <- 0 Hasta Longitud(texto) - 1 Hacer
        simbolo <- Subcadena(texto, i, i)
        Si simbolo = "," Entonces
            simbolo <- "."
        FinSi
        normalizado <- Concatenar(normalizado, simbolo)
    FinPara
    numero <- ConvertirANumero(normalizado)
FinFuncion

Funcion opcion <- LeerOpcion()
    Definir opcion Como Entero
    Definir numero Como Real
    numero <- LeerNumero("Seleccione una opcion del 1 al 7:")
    Si numero >= 1 Y numero <= 7 Y numero = Trunc(numero) Entonces
        opcion <- Trunc(numero)
    SiNo
        Escribir "Opcion invalida: seleccione un entero del 1 al 7."
        opcion <- 0
    FinSi
FinFuncion

Funcion valido <- ValidarDistancia(distancia)
    Definir valido Como Logico
    valido <- distancia > 0 Y distancia <= 30
FinFuncion

Funcion altura <- CalcularAltura(distancia)
    Definir altura Como Real
    altura <- 30 - distancia
FinFuncion

Funcion porcentaje <- CalcularPorcentaje(altura)
    Definir porcentaje Como Real
    porcentaje <- altura / 30 * 100
FinFuncion

Funcion estado <- ClasificarEstado(porcentaje)
    Definir estado Como Entero
    Si porcentaje >= 80 Entonces
        estado <- 2
    SiNo
        Si porcentaje >= 50 Entonces
            estado <- 1
        SiNo
            estado <- 0
        FinSi
    FinSi
FinFuncion

Funcion nombre <- NombreEstado(codigo)
    Definir nombre Como Cadena
    Segun codigo Hacer
        1: nombre <- "ALERTA"
        2: nombre <- "PELIGRO"
        De Otro Modo: nombre <- "NORMAL"
    FinSegun
FinFuncion

Funcion nombre <- NombreEvaluacion(codigo)
    Definir nombre Como Cadena
    Segun codigo Hacer
        1: nombre <- "SIN ALERTA"
        2: nombre <- "CON ALERTA"
        De Otro Modo: nombre <- "PENDIENTE"
    FinSegun
FinFuncion

Funcion promedio <- CalcularPromedio(valores Por Referencia, cantidad)
    Definir promedio, suma Como Real
    Definir i Como Entero
    suma <- 0
    Para i <- 0 Hasta cantidad - 1 Hacer
        suma <- suma + valores[i]
    FinPara
    Si cantidad = 0 Entonces
        promedio <- 0
    SiNo
        promedio <- suma / cantidad
    FinSi
FinFuncion

SubProceso MostrarMenu()
    Escribir "===== PLUVIA - SIMULACION ACADEMICA ====="
    Escribir "1. Registrar una medicion del nivel de agua"
    Escribir "2. Consultar el estado del desague"
    Escribir "3. Evaluar si existe una condicion anormal"
    Escribir "4. Consultar el historial de mediciones"
    Escribir "5. Consultar las alertas generadas"
    Escribir "6. Mostrar estadisticas de monitoreo"
    Escribir "7. Finalizar el programa"
FinSubProceso

SubProceso MostrarMedicion(i, lecturas Por Referencia, datos Por Referencia)
    Escribir "Lectura ", i + 1, ": distancia=", lecturas[i], " cm; altura=", datos[i,1], " cm; ocupacion=", datos[i,2], "%; estado=", NombreEstado(datos[i,3])
FinSubProceso

SubProceso RegistrarMedicion(contador Por Referencia, lecturas Por Referencia, datos Por Referencia)
    Definir distancia Como Real
    Definir valida Como Logico
    Si contador >= 20 Entonces
        Escribir "Historial lleno. No se pueden almacenar mas lecturas."
    SiNo
        Repetir
            distancia <- LeerNumero("Distancia sensor-agua en cm (mayor que 0 y hasta 30):")
            valida <- ValidarDistancia(distancia)
            Si valida Entonces
                Escribir "Lectura valida."
            SiNo
                Escribir "Distancia invalida: debe ser mayor que 0 y hasta 30 cm."
            FinSi
        Hasta Que valida
        lecturas[contador] <- distancia
        datos[contador,0] <- distancia
        datos[contador,1] <- CalcularAltura(distancia)
        datos[contador,2] <- CalcularPorcentaje(datos[contador,1])
        datos[contador,3] <- ClasificarEstado(datos[contador,2])
        datos[contador,4] <- 0
        contador <- contador + 1
        MostrarMedicion(contador - 1, lecturas, datos)
        Escribir "Evaluacion pendiente. Use la opcion 3 para generar una alerta."
    FinSi
FinSubProceso

SubProceso MostrarEstado(contador, lecturas Por Referencia, datos Por Referencia)
    Definir i Como Entero
    Si contador = 0 Entonces
        Escribir "No existen mediciones registradas."
    SiNo
        i <- contador - 1
        MostrarMedicion(i, lecturas, datos)
        Si datos[i,4] = 0 Entonces
            Escribir "Evaluacion pendiente. Use la opcion 3."
        SiNo
            Si datos[i,4] = 2 Entonces
                Escribir "Evaluada: alerta de inspeccion registrada."
            SiNo
                Escribir "Evaluada: sin alerta de inspeccion."
            FinSi
        FinSi
    FinSi
FinSubProceso

SubProceso EvaluarCondicion(contador, contadorAlertas Por Referencia, lecturas Por Referencia, datos Por Referencia)
    Definir i, estado Como Entero
    Definir anormal Como Logico
    Si contador = 0 Entonces
        Escribir "No existen mediciones registradas."
    SiNo
        i <- contador - 1
        estado <- ClasificarEstado(datos[i,2])
        datos[i,3] <- estado
        // Condicional doble obligatorio en opcion 3.
        Si estado <> 0 Entonces
            anormal <- Verdadero
            Escribir "Condicion ANORMAL: ", NombreEstado(estado)
        SiNo
            anormal <- Falso
            datos[i,4] <- 1
            Escribir "Condicion NORMAL. Sin alerta de inspeccion."
        FinSi
        // Condicional simple: alerta solo ante lectura anormal.
        Si anormal Entonces
            Si datos[i,4] <> 2 Entonces
                contadorAlertas <- contadorAlertas + 1
                datos[i,4] <- 2
                Escribir "Nueva alerta registrada."
            SiNo
                Escribir "Esta lectura ya tiene una alerta; no se duplica."
            FinSi
            MostrarMedicion(i, lecturas, datos)
            Escribir "ALERTA DE INSPECCION: nivel anormal; no confirma una obstruccion."
        FinSi
    FinSi
FinSubProceso

SubProceso MostrarHistorial(contador, lecturas Por Referencia, datos Por Referencia)
    Definir i Como Entero
    Si contador = 0 Entonces
        Escribir "No existen mediciones registradas."
    SiNo
        Para i <- 0 Hasta contador - 1 Hacer
            MostrarMedicion(i, lecturas, datos)
            Escribir "Evaluacion: ", NombreEvaluacion(datos[i,4])
        FinPara
    FinSi
FinSubProceso

SubProceso MostrarAlertas(contador, contadorAlertas, lecturas Por Referencia, datos Por Referencia)
    Definir i Como Entero
    Escribir "Alertas generadas: ", contadorAlertas
    Para i <- 0 Hasta contador - 1 Hacer
        Si datos[i,4] = 2 Entonces
            MostrarMedicion(i, lecturas, datos)
            Escribir "Requiere inspeccion preventiva."
        FinSi
    FinPara
FinSubProceso

SubProceso MostrarEstadisticas(contador, contadorAlertas, lecturas Por Referencia, datos Por Referencia)
    Definir i, pendientes, normales, alertas, peligros Como Entero
    Definir menor, mayor, sumaPorcentajes, cambioAltura Como Real
    Si contador = 0 Entonces
        Escribir "No hay datos para calcular estadisticas."
    SiNo
        menor <- lecturas[0]
        mayor <- lecturas[0]
        sumaPorcentajes <- 0
        pendientes <- 0
        normales <- 0
        alertas <- 0
        peligros <- 0
        Para i <- 0 Hasta contador - 1 Hacer
            Si lecturas[i] < menor Entonces
                menor <- lecturas[i]
            FinSi
            Si lecturas[i] > mayor Entonces
                mayor <- lecturas[i]
            FinSi
            sumaPorcentajes <- sumaPorcentajes + datos[i,2]
            Segun datos[i,3] Hacer
                0: normales <- normales + 1
                1: alertas <- alertas + 1
                2: peligros <- peligros + 1
            FinSegun
            Si datos[i,4] = 0 Entonces
                pendientes <- pendientes + 1
            FinSi
            Si i > 0 Entonces
                cambioAltura <- datos[i,1] - datos[i-1,1]
                Escribir "Cambio de altura ", i, "->", i+1, ": ", cambioAltura, " cm"
            FinSi
        FinPara
        Escribir "Total de lecturas: ", contador
        Escribir "Por estado: NORMAL=", normales, "; ALERTA=", alertas, "; PELIGRO=", peligros
        Escribir "Menor distancia: ", menor, " cm"
        Escribir "Mayor distancia: ", mayor, " cm"
        Escribir "Distancia promedio: ", CalcularPromedio(lecturas, contador), " cm"
        Escribir "Ocupacion promedio: ", sumaPorcentajes / contador, "%"
        Escribir "Alertas generadas: ", contadorAlertas
        Escribir "Mediciones pendientes de evaluar: ", pendientes
    FinSi
FinSubProceso

Algoritmo MonitoreoPluvia
    Definir opcion, contador, contadorAlertas Como Entero
    Definir lecturas, datos Como Real
    Dimension lecturas[20]
    Dimension datos[20,5]
    opcion <- 0
    contador <- 0
    contadorAlertas <- 0
    Escribir "Un punto de monitoreo. Altura didactica: 30 cm. Capacidad: 20 lecturas."
    Escribir "Menor distancia al agua significa mayor nivel. Datos ingresados manualmente."
    Mientras opcion <> 7 Hacer
        MostrarMenu()
        opcion <- LeerOpcion()
        Segun opcion Hacer
            1: RegistrarMedicion(contador, lecturas, datos)
            2: MostrarEstado(contador, lecturas, datos)
            3: EvaluarCondicion(contador, contadorAlertas, lecturas, datos)
            4: MostrarHistorial(contador, lecturas, datos)
            5: MostrarAlertas(contador, contadorAlertas, lecturas, datos)
            6: MostrarEstadisticas(contador, contadorAlertas, lecturas, datos)
            7: Escribir "Programa finalizado."
        FinSegun
    FinMientras
FinAlgoritmo
