db.createView("twitter_count","twitter",[
    {
        $match:{
            area_name:{
                $exists:true
            }
        }

    },
    {$unwind:"$categories"},
    {
	$group:{
		_id:{
		  year:{$year:"$time"},
		  hour:{$hour:"$time"},
		  day:{$dayOfMonth:"$time"},
		  month:{$month:"$time"},
		  area_name:"$area_name",
		  categories:"$categories"
		},
		count:{
			$sum:1
		}
	}},{
		$project:{
			count:1,
			categories:1,
			date: {$dateFromParts:{
				year:"$_id.year",
				month:"$_id.month",
				day:"$_id.day",
				hour:"$_id.hour",
				minute:59,
				second:59,
				millisecond:999,
			}}
		}
	}])