import { View, TouchableOpacity, Keyboard, Alert } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { DateData } from "react-native-calendars"
import {
	CalendarRange,
	Info,
	MapPin,
	Settings2,
	Calendar as IconCalendar,
} from "lucide-react-native"
import dayjs from "dayjs"

import { colors } from "@/styles/colors"
import { TripDetails, tripServer } from "@/server/trip-server"
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils"

import { Loading } from "@/components/loading"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { Modal } from "@/components/modal"
import { Calendar } from "@/components/calendar"

import { Activities } from "./activities"
import { Details } from "./details"

export type TripData = TripDetails & {
	when: string
}

enum MODAL {
	NONE = 0,
	UPDATE_TRIP = 1,
	CALENDAR = 2,
}

export default function Trip() {
	//LOADING
	const [isLoadingTrip, setIsLoadingTrip] = useState(true)
	const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)

	//MODAL
	const [showModal, setShowModal] = useState(MODAL.NONE)

	//DATA
	const [tripDetails, setTripDetails] = useState({} as TripData)
	const [option, setOption] = useState<"activity" | "details">()
	const [destination, setDestination] = useState("")
	const [selectedDates, setSelectedDates] = useState({} as DatesSelected)

	const tripID = useLocalSearchParams<{ id: string }>().id

	async function getTripDetails() {
		try {
			setIsLoadingTrip(true)

			if (!tripID) return router.back()

			const trip = await tripServer.getById(tripID)

			const maxLengthDestination = 16

			const destination =
				trip.destination.length > maxLengthDestination
					? trip.destination.slice(0, maxLengthDestination) + "..."
					: trip.destination

			const starts_at = dayjs(trip.starts_at).format("DD")
			const ends_at = dayjs(trip.ends_at).format("DD")
			const month = dayjs(trip.starts_at).format("MMM")

			setDestination(trip.destination)

			setTripDetails({
				...trip,
				when: `${destination} de ${starts_at} a ${ends_at} de ${month}.`,
			})
		} catch (error) {
			console.log(error)
		} finally {
			setIsLoadingTrip(false)
		}
	}

	function handleSelectDate(selectedDay: DateData) {
		const dates = calendarUtils.orderStartsAtAndEndsAt({
			startsAt: selectedDates.startsAt,
			endsAt: selectedDates.endsAt,
			selectedDay,
		})

		setSelectedDates(dates)
	}

	async function handleUpdateTrip() {
		try {
			if (!tripID) return

			if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
				return Alert.alert(
					"Atualizar viagem",
					"Lembre-se de além de preencher o destino, selecione a data de início e o fim da viagem."
				)
			}

			setIsUpdatingTrip(true)

			await tripServer.update({
				id: tripID,
				destination,
				starts_at: dayjs(selectedDates.startsAt.dateString).toString(),
				ends_at: dayjs(selectedDates.endsAt.dateString).toString(),
			})

			Alert.alert("Atualizar viagem", "Viagem atualizada com sucesso!", [
				{
					text: "OK",
					onPress: () => {
						setShowModal(MODAL.NONE)
						getTripDetails
					},
				},
			])
		} catch (error) {
			console.log(error)
		} finally {
			setIsUpdatingTrip(false)
		}
	}

	useEffect(() => {
		getTripDetails()
	}, [])

	if (isLoadingTrip) {
		return <Loading />
	}

	return (
		<View className="flex-1 px-5 pt-16">
			<Input variant="tertiary">
				<MapPin color={colors.zinc[400]} size={20} />
				<Input.Field value={tripDetails.when} readOnly />
				<TouchableOpacity
					activeOpacity={0.5}
					className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
					onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
				>
					<Settings2 color={colors.zinc[400]} size={20} />
				</TouchableOpacity>
			</Input>

			{option === "activity" ? (
				<Activities tripDetails={tripDetails} />
			) : (
				<Details tripId={tripDetails.id} />
			)}

			<View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
				<View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
					<Button
						className="flex-1"
						onPress={() => setOption("activity")}
						variant={option === "activity" ? "primary" : "secondary"}
					>
						<CalendarRange
							color={
								option === "activity" ? colors.lime[950] : colors.zinc[200]
							}
							size={20}
						/>
						<Button.Title>Atividades</Button.Title>
					</Button>

					<Button
						className="flex-1"
						onPress={() => setOption("details")}
						variant={option === "details" ? "primary" : "secondary"}
					>
						<Info
							color={option === "details" ? colors.lime[950] : colors.zinc[200]}
							size={20}
						/>
						<Button.Title>Detalhes</Button.Title>
					</Button>
				</View>
			</View>
			<Modal
				title="Atualizar Viagem"
				subtitle="Somente quem criou a viagem pode editar."
				visible={showModal === MODAL.UPDATE_TRIP}
				onClose={() => setShowModal(MODAL.NONE)}
			>
				<View className="gap-2 my-4">
					<Input variant="secondary">
						<MapPin color={colors.zinc[400]} size={20} />
						<Input.Field
							placeholder="Para onde?"
							onChangeText={setDestination}
							value={destination}
						/>
					</Input>

					<Input variant="secondary">
						<IconCalendar color={colors.zinc[400]} size={20} />
						<Input.Field
							placeholder="Quando?"
							value={selectedDates.formatDatesInText}
							onPressIn={() => setShowModal(MODAL.CALENDAR)}
							onFocus={() => Keyboard.dismiss()}
						/>
					</Input>
					<Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
						<Button.Title>Atualizar</Button.Title>
					</Button>
				</View>
			</Modal>

			<Modal
				title="Selecionar datas"
				subtitle="Selecione a data de ida e volta da viagem"
				visible={showModal === MODAL.CALENDAR}
				onClose={() => setShowModal(MODAL.NONE)}
			>
				<View className="gap-4 mt-4">
					<Calendar
						minDate={dayjs().toISOString()}
						onDayPress={handleSelectDate}
						markedDates={selectedDates.dates}
					/>
					<Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
						<Button.Title>Confirmar</Button.Title>
					</Button>
				</View>
			</Modal>
		</View>
	)
}
